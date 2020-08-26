import React from 'react';
import KeepAlive, { KeepAliveProps } from './KeepAlive';

export default function injectKeepAlive(opt: KeepAliveProps) {
  return function <P = {}>(Component: React.ComponentType<P>) {
    return (props: P) => (
      <KeepAlive {...opt}>
        <Component {...props} />
      </KeepAlive>
    );
  };
}
