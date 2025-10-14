import Big from 'big.js';
import numeral from 'numeral';
import * as R from 'ramda';
import { SyntheticEvent, useCallback, useState } from 'react';
import chainConfig from '@/chainConfig';
import { useValidatorsQuery, ValidatorsQuery } from '@/graphql/types/general_types';
import { SlashingParams } from '@/models';
import type {
  ItemType,
  ValidatorsState,
  ValidatorType,
} from '@/screens/validators/components/list/types';
import { formatToken } from '@/utils/format_token';
import { getValidatorCondition } from '@/utils/get_validator_condition';

const { extra, votingPowerTokenUnit } = chainConfig();

// ==========================
// Parse data
// ==========================
const formatValidators = (data: ValidatorsQuery): Partial<ValidatorsState> => {
  console.log('🚀 formatValidators CALLED with data:', data);
  console.log('🚀 data.validator length:', data?.validator?.length || 0);
  
  // Force visible debugging - this will show in the UI if our function runs
  if (typeof window !== 'undefined') {
    window.document.title = `DEBUG: formatValidators called with ${data?.validator?.length || 0} validators`;
  }
  
  const slashingParams = SlashingParams.fromJson(data?.slashingParams?.[0]?.params ?? {});
  const votingPowerOverall =
    numeral(
      formatToken(data?.stakingPool?.[0]?.bondedTokens ?? 0, votingPowerTokenUnit).value
    ).value() ?? 0;

  const { signedBlockWindow } = slashingParams;

  let formattedItems: ValidatorType[] = data.validator
    .filter((x) => x.validatorInfo)
    .map((x) => {
      const votingPowerRaw = x?.validatorVotingPowers?.[0]?.votingPower ?? 0;
      console.log('🔍 DEBUG - votingPowerRaw:', votingPowerRaw);
      
      const formattedToken = formatToken(votingPowerRaw, votingPowerTokenUnit);
      console.log('🔍 DEBUG - formattedToken:', formattedToken);
      console.log('🔍 DEBUG - votingPowerTokenUnit:', votingPowerTokenUnit);
      
      const numeralResult = numeral(formattedToken.value);
      console.log('🔍 DEBUG - numeralResult:', numeralResult);
      
      const votingPower = numeralResult.value() ?? 0;
      console.log('🔍 DEBUG - final votingPower:', votingPower);
      
      // Alternative debugging methods
      if (typeof window !== 'undefined') {
        window.console.log('🌐 WINDOW DEBUG - votingPower:', votingPower);
      }
      const votingPowerPercent = votingPowerOverall
        ? numeral((votingPower / votingPowerOverall) * 100).value()
        : 0;

      const missedBlockCounter = x?.validatorSigningInfos?.[0]?.missedBlocksCounter ?? 0;
      const condition = getValidatorCondition(signedBlockWindow, missedBlockCounter);

      return {
        validator: x.validatorInfo?.operatorAddress ?? '',
        votingPower: votingPower ?? 0,
        votingPowerPercent: votingPowerPercent ?? 0,
        commission: (x?.validatorCommissions?.[0]?.commission ?? 0) * 100,
        condition,
        status: x?.validatorStatuses?.[0]?.status ?? 0,
        jailed: x?.validatorStatuses?.[0]?.jailed ?? false,
        tombstoned: x?.validatorSigningInfos?.[0]?.tombstoned ?? false,
      };
    });

  // get the top 34% validators
  formattedItems = formattedItems.sort((a, b) => (a.votingPower > b.votingPower ? -1 : 1));

  // add key to indicate they are part of top 34%
  let cumulativeVotingPower = Big(0);
  let reached = false;
  formattedItems.forEach((x) => {
    if (x.status === 3) {
      const totalVp = cumulativeVotingPower.add(x.votingPowerPercent);
      if (totalVp.lte(34) && !reached) {
        x.topVotingPower = true;
      }

      if (totalVp.gt(34) && !reached) {
        x.topVotingPower = true;
        reached = true;
      }

      cumulativeVotingPower = totalVp;
    }
  });

  return {
    votingPowerOverall,
    items: formattedItems,
  };
};

export const useValidators = () => {
  console.log('🎯 useValidators hook initialized');
  
  const [search, setSearch] = useState('');
  const [state, setState] = useState<ValidatorsState>({
    loading: true,
    exists: true,
    items: [],
    votingPowerOverall: 0,
    tab: 0,
    sortKey: 'validator.name',
    sortDirection: 'asc',
  });

  const handleSetState = useCallback(
    (stateChange: (prevState: ValidatorsState) => ValidatorsState) => {
      setState((prevState) => {
        const newState = stateChange(prevState);
        return R.equals(prevState, newState) ? prevState : newState;
      });
    },
    []
  );

  // ==========================
  // Fetch Data
  // ==========================
  useValidatorsQuery({
    onCompleted: (data) => {
      console.log('✅ useValidatorsQuery onCompleted triggered');
      console.log('✅ Query data received:', data);
      handleSetState((prevState) => ({
        ...prevState,
        loading: false,
        ...formatValidators(data),
      }));
    },
    onError: (error: any) => {
      console.log('❌ useValidatorsQuery onError triggered');
      console.log('❌ Query error:', error);
      handleSetState((prevState) => ({
        ...prevState,
        loading: false,
        exists: false,
      }));
    },
  });

  const handleTabChange = useCallback(
    (_event: SyntheticEvent<Element, globalThis.Event>, newValue: number) => {
      setState((prevState) => ({
        ...prevState,
        tab: newValue,
      }));
    },
    []
  );

  const handleSort = useCallback(
    (key: string) => {
      if (key === state.sortKey) {
        setState((prevState) => ({
          ...prevState,
          sortDirection: prevState.sortDirection === 'asc' ? 'desc' : 'asc',
        }));
      } else {
        setState((prevState) => ({
          ...prevState,
          sortKey: key,
          sortDirection: 'asc', // new key so we start the sort by asc
        }));
      }
    },
    [state.sortKey]
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const sortItems = useCallback(
    (items: ItemType[]) => {
      let sorted: ItemType[] = R.clone(items);

      if (state.tab === 0) {
        sorted = sorted.filter((x) => x.status === 3);
      }

      if (state.tab === 1) {
        sorted = sorted.filter((x) => x.status !== 3);
      }

      if (search) {
        sorted = sorted.filter((x) => {
          const formattedSearch = search.toLowerCase().replace(/ /g, '');
          return (
            x.validator.name.toLowerCase().replace(/ /g, '').includes(formattedSearch) ||
            x.validator.address.toLowerCase().includes(formattedSearch)
          );
        });
      }

      if (state.sortKey && state.sortDirection) {
        sorted.sort((a, b) => {
          let compareA = R.pathOr('', [...state.sortKey.split('.')], a);
          let compareB = R.pathOr('', [...state.sortKey.split('.')], b);

          if (typeof compareA === 'string' && typeof compareB === 'string') {
            compareA = compareA.toLowerCase();
            compareB = compareB.toLowerCase();
          }

          if (compareA < compareB) {
            return state.sortDirection === 'asc' ? -1 : 1;
          }
          if (compareA > compareB) {
            return state.sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      return sorted;
    },
    [search, state.sortDirection, state.sortKey, state.tab]
  );

  return {
    state,
    handleTabChange,
    handleSort,
    handleSearch,
    sortItems,
    search,
  };
};
