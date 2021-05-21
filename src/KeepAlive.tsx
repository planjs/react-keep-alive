import React from 'react';
import AsyncComponent from './AsyncComponent';
import { START_MOUNTING_DOM, LIFECYCLE } from './Provider';
import keepAlive, { COMMAND } from './utils/keepAliveDecorator';
import changePositionByComment from './utils/changePositionByComment';

export interface KeepAliveProps<P = any> {
  key?: string;
  name?: string;
  disabled?: boolean;
  extra?: any;
  dynamicPros?: (componentProps: P, keepAliveProps: KeepAliveProps) => KeepAliveProps;
}

interface IKeepAliveInnerProps extends KeepAliveProps {
  _container: any;
}

class KeepAlive extends React.PureComponent<IKeepAliveInnerProps> {
  private bindUnmount: (() => void) | null = null;

  private bindUnactivate: (() => void) | null = null;

  private unmounted = false;

  private mounted = false;

  private ref: null | Element = null;

  private refNextSibling: null | Node = null;

  private childNodes: Node[] = [];

  componentDidMount() {
    const { _container } = this.props;
    const { notNeedActivate, identification, eventEmitter, keepAlive } = _container;
    notNeedActivate();
    const cb = () => {
      this.mount();
      this.listen();
      eventEmitter.off([identification, START_MOUNTING_DOM], cb);
    };
    eventEmitter.on([identification, START_MOUNTING_DOM], cb);
    if (keepAlive) {
      this.componentDidActivate();
    }
  }

  componentDidActivate() {
    // tslint-disable
  }

  componentDidUpdate() {
    const { _container } = this.props;
    const { notNeedActivate, isNeedActivate } = _container;
    if (isNeedActivate()) {
      notNeedActivate();
      this.mount();
      this.listen();
      this.unmounted = false;
      this.componentDidActivate();
    }
  }

  componentWillUnactivate() {
    this.unmount();
    this.unListen();
  }

  componentWillUnmount() {
    if (!this.unmounted) {
      this.unmounted = true;
      this.unmount();
      this.unListen();
    }
  }

  private mount() {
    const {
      _container: { cache, identification, storeElement, setLifecycle },
    } = this.props;
    this.setMounted(true);
    const { renderElement } = cache[identification];
    setLifecycle(LIFECYCLE.UPDATING);
    changePositionByComment(identification, renderElement, storeElement);
  }

  private correctionPosition = () => {
    if (this.ref && this.ref.parentNode && this.ref.nextSibling) {
      const childNodes = this.ref.childNodes as any;
      this.refNextSibling = this.ref.nextSibling;
      this.childNodes = [];
      while (childNodes.length) {
        const child = childNodes[0];
        this.childNodes.push(child);
        this.ref.parentNode.insertBefore(child, this.ref.nextSibling);
      }
      this.ref.parentNode.removeChild(this.ref);
    }
  };

  private retreatPosition = () => {
    if (this.ref && this.refNextSibling && this.refNextSibling.parentNode) {
      for (const child of this.childNodes) {
        this.ref.appendChild(child);
      }
      this.refNextSibling.parentNode.insertBefore(this.ref, this.refNextSibling);
    }
  };

  private unmount() {
    const {
      _container: { identification, storeElement, cache, setLifecycle },
    } = this.props;
    const { renderElement, ifStillActivate, reactivate } = cache[identification];
    setLifecycle(LIFECYCLE.UNMOUNTED);
    this.retreatPosition();
    changePositionByComment(identification, storeElement, renderElement);
    if (ifStillActivate) {
      reactivate();
    }
  }

  private listen() {
    const {
      _container: { identification, eventEmitter },
    } = this.props;
    eventEmitter.on(
      [identification, COMMAND.CURRENT_UNMOUNT],
      (this.bindUnmount = this.componentWillUnmount.bind(this)),
    );
    eventEmitter.on(
      [identification, COMMAND.CURRENT_UNACTIVATE],
      (this.bindUnactivate = this.componentWillUnactivate.bind(this)),
    );
  }

  private unListen() {
    const {
      _container: { identification, eventEmitter },
    } = this.props;
    eventEmitter.off([identification, COMMAND.CURRENT_UNMOUNT], this.bindUnmount);
    eventEmitter.off([identification, COMMAND.CURRENT_UNACTIVATE], this.bindUnactivate);
  }

  private setMounted = (value: boolean) => {
    this.mounted = value;
  };

  private getMounted = () => this.mounted;

  render() {
    // The purpose of this div is to not report an error when moving the DOM,
    // so you need to remove this div later.
    return (
      <div ref={(ref) => (this.ref = ref)}>
        <AsyncComponent
          setMounted={this.setMounted}
          getMounted={this.getMounted}
          onUpdate={this.correctionPosition}
        >
          {this.props.children}
        </AsyncComponent>
      </div>
    );
  }
}

export default keepAlive<KeepAliveProps>(KeepAlive);
