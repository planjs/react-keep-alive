import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import noop from './noop';
import { warn } from './debug';
import { COMMAND } from './keepAliveDecorator';
import withIdentificationContextConsumer from './withIdentificationContextConsumer';
import getDisplayName from './getDisplayName';

export const bindLifecycleTypeName = '$$bindLifecycle';

export interface IKeepAliveLifecycleImpl {
  componentDidActivate?(): void;
  componentWillUnactivate?(): void;
}

export default function bindLifecycle<P = any, S = {}>(Component: React.ComponentClass<P, S>) {
  const WrappedComponent = (Component as any).WrappedComponent || (Component as any).wrappedComponent || Component;

  const {
    componentDidMount = noop,
    componentDidUpdate = noop,
    componentWillUnmount = noop,
    shouldComponentUpdate = noop,
  } = WrappedComponent.prototype;

  WrappedComponent.prototype.componentDidMount = function () {
    componentDidMount.call(this);
    if (!this.props._container) {
      return;
    }
    this._needActivate = false;
    const {
      _container: { identification, eventEmitter, activated },
      keepAlive,
    } = this.props;
    // Determine whether to execute the componentDidActivate life cycle of the current component based on the activation state of the KeepAlive components
    if (!activated && keepAlive !== false) {
      this.componentDidActivate && this.componentDidActivate.call(this);
    }
    eventEmitter.on(
      [identification, COMMAND.ACTIVATE],
      (this._bindActivate = () => (this._needActivate = true)),
      true,
    );
    eventEmitter.on(
      [identification, COMMAND.UNACTIVATE],
      (this._bindUnactivate = () => {
        this.componentWillUnactivate && this.componentWillUnactivate.call(this);
        this._unmounted = false;
      }),
      true,
    );
    eventEmitter.on(
      [identification, COMMAND.UNMOUNT],
      (this._bindUnmount = () => {
        componentWillUnmount.call(this);
        this._unmounted = true;
      }),
      true,
    );
  };

  // In order to be able to re-update after transferring the DOM, we need to block the first update.
  WrappedComponent.prototype.shouldComponentUpdate = function (...args: any) {
    if (this._needActivate) {
      this.forceUpdate();
      return false;
    }
    return shouldComponentUpdate.call(this, ...args) || true;
  };

  WrappedComponent.prototype.componentDidUpdate = function (...args: any) {
    componentDidUpdate.call(this, ...args);
    if (this._needActivate) {
      this._needActivate = false;
      this.componentDidActivate && this.componentDidActivate.call(this);
    }
  };

  WrappedComponent.prototype.componentWillUnmount = function () {
    if (!this._unmounted) {
      componentWillUnmount.call(this);
    }
    if (!this.props._container) {
      return;
    }
    const {
      _container: { identification, eventEmitter },
    } = this.props;
    eventEmitter.off([identification, COMMAND.ACTIVATE], this._bindActivate);
    eventEmitter.off([identification, COMMAND.UNACTIVATE], this._bindUnactivate);
    eventEmitter.off([identification, COMMAND.UNMOUNT], this._bindUnmount);
  };

  const BindLifecycleHOC = withIdentificationContextConsumer(
    ({
      forwardRef,
      _identificationContextProps: {
        identification, eventEmitter, activated, keepAlive, extra,
      },
      ...wrapperProps
    }) => {
      if (!identification) {
        warn('[React Keep Alive] You should not use bindLifecycle outside a <KeepAlive>.');
        return null;
      }
      return (
        <Component
          {...extra}
          {...wrapperProps}
          ref={forwardRef || noop}
          _container={{
            identification,
            eventEmitter,
            activated,
            keepAlive,
          }}
        />
      );
    },
  );

  const BindLifecycle = React.forwardRef((props: P, ref) => (
    <BindLifecycleHOC {...props} forwardRef={ref} />
  ));

  (BindLifecycle as any).WrappedComponent = WrappedComponent;
  BindLifecycle.displayName = `${bindLifecycleTypeName}(${getDisplayName(Component as any)})`;

  return hoistNonReactStatics(BindLifecycle, Component) as any;
}
