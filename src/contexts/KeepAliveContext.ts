import React from 'react';

import { IKeepAliveProviderImpl, IKeepAliveProviderProps } from '../Provider';

export type IKeepAliveContextProps = IKeepAliveProviderImpl & IKeepAliveProviderProps;

const KeepAliveContext = React.createContext<IKeepAliveContextProps>({} as any);

export default KeepAliveContext;
