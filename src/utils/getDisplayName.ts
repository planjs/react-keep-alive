import React from 'react';

export default function getDisplayName(Component: React.ComponentType<any>) {
  return Component.displayName || Component.name || 'Component';
}
