'use client';
import { createContext, type PropsWithChildren, useState } from 'react';

const settings = {
  name: 'Give Tron',
  version: '1.0',
  theme: 'light',
  wallet: '',
  user: '',
} as const;

type Config = typeof settings;

type ConfigContextType = {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
};

export const ConfigContext = createContext<ConfigContextType>(
  {} as ConfigContextType,
);

export function ConfigProvider(props: PropsWithChildren) {
  const children = props.children;
  const [config, setConfig] = useState(settings);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}
