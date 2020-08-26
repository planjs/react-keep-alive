import React, { useEffect, useContext, useRef } from 'react';
import { warn } from './debug';
import { COMMAND } from './keepAliveDecorator';
import IdentificationContext, {
  IIdentificationContextProps,
} from '../contexts/IdentificationContext';

type VoidFN = (() => void) | null

export default function useKeepAliveEffect(effect: React.EffectCallback) {
  if (!useEffect) {
    warn('[React Keep Alive] useKeepAliveEffect API requires react 16.8 or later.');
  }
  const { eventEmitter, identification } = useContext<IIdentificationContextProps>(
    IdentificationContext,
  );
  const effectRef: React.MutableRefObject<React.EffectCallback> = useRef(effect);
  effectRef.current = effect;
  useEffect(() => {
    let bindActivate: VoidFN = null;
    let bindUnactivated: VoidFN = null;
    let bindUnmount: VoidFN = null;
    let effectResult = effectRef.current();
    let unmounted = false;
    eventEmitter.on(
      [identification, COMMAND.ACTIVATE],
      (bindActivate = () => {
        // Delayed update
        Promise.resolve().then(() => {
          effectResult = effectRef.current();
        });
        unmounted = false;
      }),
      true,
    );
    eventEmitter.on(
      [identification, COMMAND.UNACTIVATE],
      (bindUnactivated = () => {
        if (effectResult) {
          effectResult();
          unmounted = true;
        }
      }),
      true,
    );
    eventEmitter.on(
      [identification, COMMAND.UNMOUNT],
      (bindUnmount = () => {
        if (effectResult) {
          effectResult();
          unmounted = true;
        }
      }),
      true,
    );
    return () => {
      if (effectResult && !unmounted) {
        effectResult();
      }
      eventEmitter.off([identification, COMMAND.ACTIVATE], bindActivate);
      eventEmitter.off([identification, COMMAND.UNACTIVATE], bindUnactivated);
      eventEmitter.off([identification, COMMAND.UNMOUNT], bindUnmount);
    };
    // eslint-disable-next-line
  }, []);
}
