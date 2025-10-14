import numeral from 'numeral';
import * as R from 'ramda';
import { useCallback, useState } from 'react';
import chainConfig from '@/chainConfig';
import { OnlineVotingPowerQuery, useOnlineVotingPowerQuery } from '@/graphql/types/general_types';
import { formatToken } from '@/utils/format_token';

const { votingPowerTokenUnit } = chainConfig();

type OnlineVotingPowerState = {
  votingPower: number;
  totalVotingPower: number;
  activeValidators: number;
};

const initialState: OnlineVotingPowerState = {
  votingPower: 0,
  totalVotingPower: 0,
  activeValidators: 0,
};

const formatOnlineVotingPower = (data: OnlineVotingPowerQuery) => {
  const votingPowerRaw = data?.validatorVotingPowerAggregate?.aggregate?.sum?.votingPower ?? 0;
  const bonded = data?.stakingPool?.[0]?.bonded ?? 0;
  const activeValidators = data?.activeTotal?.aggregate?.count ?? 0;

  console.log('🏛️ Online VP - votingPowerRaw:', votingPowerRaw);
  console.log('🏛️ Online VP - bonded:', bonded);
  console.log('🏛️ Online VP - votingPowerTokenUnit:', votingPowerTokenUnit);
  
  // Format both voting power and total voting power using the same token unit
  const formattedVotingPower = formatToken(votingPowerRaw, votingPowerTokenUnit);
  const formattedTotalVotingPower = formatToken(bonded, votingPowerTokenUnit);
  
  console.log('🏛️ Online VP - formattedVotingPower:', formattedVotingPower);
  console.log('🏛️ Online VP - formattedTotalVotingPower:', formattedTotalVotingPower);
  
  const votingPower = numeral(formattedVotingPower.value).value() ?? 0;
  const totalVotingPower = numeral(formattedTotalVotingPower.value).value() ?? 0;
  
  console.log('🏛️ Online VP - final votingPower:', votingPower);
  console.log('🏛️ Online VP - final totalVotingPower:', totalVotingPower);

  return {
    activeValidators,
    votingPower,
    totalVotingPower,
  };
};

export const useOnlineVotingPower = () => {
  const [onlineVPstate, setOnlineVPState] = useState(initialState);

  const handleSetState = useCallback(
    (stateChange: (prevState: OnlineVotingPowerState) => OnlineVotingPowerState) => {
      setOnlineVPState((prevState) => {
        const newState = stateChange(prevState);
        return R.equals(prevState, newState) ? prevState : newState;
      });
    },
    []
  );

  useOnlineVotingPowerQuery({
    onCompleted: (data) => {
      handleSetState((prevState) => ({
        ...prevState,
        ...formatOnlineVotingPower(data),
      }));
    },
  });

  return {
    onlineVPstate,
  };
};
