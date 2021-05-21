import React from 'react';
import KeepAlive, { KeepAliveProps } from './KeepAlive';

export default function injectKeepAlive<P = {}>(opt: KeepAliveProps<P>) {
  return function (Component: React.ComponentType<P>) {
    return (props: P) => {
      return (
        <KeepAlive {...(opt?.dynamicPros?.(props, opt) || opt)}>
          <Component {...props} />
        </KeepAlive>
      );
    };
  };
}
