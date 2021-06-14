import { useMemo } from 'react';
import useRerender from '../../hooks/useRerender';

export interface DataRefreshPolicyItem {
  name: Minecraft.DataRefreshPolicy;
  enabled: boolean;
  description: string;
  enable: () => void;
  disable: () => void;
}

const policyMap: Record<Minecraft.DataRefreshPolicy, string> = {
  WORLD: 'クラウドストレージからワールドデータを同期します。',
  DATAPACK: 'クラウドストレージからデータパックを同期します。',
};

const policies = Object.entries(policyMap) as [Minecraft.DataRefreshPolicy, string][];

export default function useDataRefreshPolicy() {
  const rerender = useRerender();
  const createValue = useMemo(() => {
    const set = new Set<Minecraft.DataRefreshPolicy>();
    const base = policies.map<Omit<DataRefreshPolicyItem, 'enabled'>>(([policy, description]) => {
      const enable = () => {
        if (set.has(policy)) return;
        set.add(policy);
        rerender();
      };
      const disable = () => {
        if (!set.has(policy)) return;
        set.delete(policy);
        rerender();
      };
      return { name: policy, description, enable, disable };
    });
    return () => {
      const policies = Array.from(set.values());
      const uiItems = base.map<DataRefreshPolicyItem>((item) => ({
        enabled: set.has(item.name),
        ...item,
      }));
      return { policies, uiItems };
    };
  }, []);

  return useMemo(() => createValue(), [rerender.count]);
}
