import React from 'react';
import ReactDOM from 'react-dom';
import Comment from './Comment';
import KeepAliveContext from './contexts/KeepAliveContext';
import createEventEmitter from './utils/createEventEmitter';
import createUniqueIdentification from './utils/createUniqueIdentification';
import createStoreElement from './utils/createStoreElement';
import md5 from './utils/md5';

export const keepAliveProviderTypeName = '$$KeepAliveProvider';
export const START_MOUNTING_DOM = 'startMountingDOM';

export enum LIFECYCLE {
  MOUNTED,
  UPDATING,
  UNMOUNTED,
}

export interface ICacheItem {
  children: React.ReactNode;
  keepAlive: boolean;
  lifecycle: LIFECYCLE;
  renderElement?: HTMLElement;
  activated?: boolean;
  ifStillActivate?: boolean;
  reactivate?: () => void;
}

export interface ICache {
  [key: string]: ICacheItem;
}

export interface IKeepAliveProviderImpl {
  storeElement: HTMLElement;
  cache: ICache;
  keys: string[];
  eventEmitter: any;
  existed: boolean;
  providerIdentification: string;
  setCache: (identification: string, value: ICacheItem) => void;
  clearCache: (...keys: string[]) => void;
  clearAllCache: () => void;
  unactivate: (identification: string) => void;
  isExisted: () => boolean;
}

export interface IKeepAliveProviderProps {
  include?: string | string[] | RegExp;
  exclude?: string | string[] | RegExp;
  /**
   * 最大缓存组件数
   */
  max?: number;
  /**
   * 获取缓存组件存放位置
   */
  getStoreElementContainer?: () => HTMLElement;
}

export default class KeepAliveProvider
  extends React.PureComponent<IKeepAliveProviderProps>
  implements IKeepAliveProviderImpl {
  static displayName = keepAliveProviderTypeName;

  static defaultProps = {
    max: 10,
    getStoreElementContainer() {
      return createStoreElement();
    },
  };

  storeElement!: HTMLElement;

  // Sometimes data that changes with setState cannot be synchronized, so force refresh
  cache: ICache = Object.create(null);

  keys: string[] = [];

  eventEmitter = createEventEmitter();

  existed: boolean = true;

  private needRerender: boolean = false;

  providerIdentification: string = createUniqueIdentification();

  constructor(props: IKeepAliveProviderProps) {
    super(props);

    if (props.getStoreElementContainer) {
      this.storeElement = props.getStoreElementContainer();
    }
  }

  componentDidUpdate() {
    if (this.needRerender) {
      this.needRerender = false;
      this.forceUpdate();
    }
  }

  componentWillUnmount() {
    this.existed = false;
    document.body.removeChild(this.storeElement);
  }

  isExisted = () => this.existed;

  setCache = (identification: string, value: ICacheItem) => {
    const { cache, keys } = this;
    const { max } = this.props;
    const currentCache = cache[identification];
    if (!currentCache) {
      keys.push(identification);
    }
    this.cache[identification] = {
      ...currentCache,
      ...value,
    };
    this.forceUpdate(() => {
      // If the maximum value is set, the value in the cache is deleted after it goes out.
      if (currentCache) {
        return;
      }
      if (!max) {
        return;
      }
      const difference = keys.length - (max as number);
      if (difference <= 0) {
        return;
      }
      const spliceKeys = keys.splice(0, difference);
      this.forceUpdate(() => {
        spliceKeys.forEach((key) => {
          delete cache[key as string];
        });
      });
    });
  };

  unactivate = (identification: string) => {
    const { cache } = this;
    this.cache[identification] = {
      ...cache[identification],
      activated: false,
      lifecycle: LIFECYCLE.UNMOUNTED,
    };
    this.forceUpdate();
  };

  private startMountingDOM = (identification: string) => {
    this.eventEmitter.emit([identification, START_MOUNTING_DOM]);
  };

  clearCache = (...keys: string[]) => {
    keys.forEach((key) => this.unactivate(md5(`${this.providerIdentification}${key}`)));
  };

  clearAllCache = () => {
    Object.keys(this.cache).forEach(this.unactivate);
  };

  render() {
    const {
      cache,
      keys,
      providerIdentification,
      isExisted,
      setCache,
      clearCache,
      clearAllCache,
      existed,
      unactivate,
      storeElement,
      eventEmitter,
    } = this;
    const { children: innerChildren, include, exclude } = this.props;
    if (!storeElement) {
      return innerChildren;
    }
    return (
      <KeepAliveContext.Provider
        value={{
          cache,
          keys,
          existed,
          providerIdentification,
          isExisted,
          setCache,
          clearCache,
          clearAllCache,
          unactivate,
          storeElement,
          eventEmitter,
          include,
          exclude,
        }}
      >
        <>
          {innerChildren}
          {ReactDOM.createPortal(
            keys
              .map((identification) => {
                const currentCache = cache[identification];
                const { keepAlive, children, lifecycle } = currentCache;
                let cacheChildren = children;
                if (lifecycle === LIFECYCLE.MOUNTED && !keepAlive) {
                  // If the cache was last enabled, then the components of this keepAlive package are used,
                  // and the cache is not enabled, the UI needs to be reset.
                  cacheChildren = null;
                  this.needRerender = true;
                  currentCache.lifecycle = LIFECYCLE.UPDATING;
                }
                // current true, previous true | undefined, keepAlive false, not cache
                // current true, previous true | undefined, keepAlive true, cache

                // current true, previous false, keepAlive true, cache
                // current true, previous false, keepAlive false, not cache
                return cacheChildren ? (
                  <React.Fragment key={identification}>
                    <Comment>{identification}</Comment>
                    {cacheChildren}
                    <Comment onLoaded={() => this.startMountingDOM(identification)}>
                      {identification}
                    </Comment>
                  </React.Fragment>
                ) : null;
              })
              .filter((v) => v),
            storeElement,
          )}
        </>
      </KeepAliveContext.Provider>
    );
  }
}
