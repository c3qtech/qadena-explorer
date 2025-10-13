import * as R from 'ramda';

class GovParams {
  public depositParams: {
    minDeposit: Array<{
      denom: string;
      amount: string;
    }>;
    maxDepositPeriod: number;
  };

  public tallyParams: {
    quorum: string;
    threshold: string;
    vetoThreshold: string;
  };

  public votingParams: {
    votingPeriod: number;
  };

  constructor(payload: object) {
    // Handle both old structure (separate params) and new structure (unified params)
    const params = R.pathOr({}, ['params'], payload);
    const hasUnifiedParams = !R.isEmpty(params);
    
    this.depositParams = hasUnifiedParams ? {
      minDeposit: R.pathOr([], ['min_deposit'], params),
      maxDepositPeriod: R.pathOr(0, ['max_deposit_period'], params),
    } : R.pathOr(
      {
        minDeposit: [],
        maxDepositPeriod: 0,
      },
      ['depositParams'],
      payload
    );
    
    this.tallyParams = hasUnifiedParams ? {
      quorum: R.pathOr('', ['quorum'], params),
      threshold: R.pathOr('', ['threshold'], params),
      vetoThreshold: R.pathOr('', ['veto_threshold'], params),
    } : R.pathOr(
      {
        quorum: '',
        threshold: '',
        vetoThreshold: '',
      },
      ['tallyParams'],
      payload
    );
    
    this.votingParams = hasUnifiedParams ? {
      votingPeriod: R.pathOr(0, ['voting_period'], params),
    } : R.pathOr(
      {
        votingPeriod: 0,
      },
      ['votingParams'],
      payload
    );
  }

  static fromJson(data: object): GovParams {
    // Handle both old structure (separate params) and new structure (unified params)
    const params = R.pathOr({}, ['params'], data);
    const hasUnifiedParams = !R.isEmpty(params);

    console.log(params)
    console.log(hasUnifiedParams)
    
    
    if (hasUnifiedParams) {
      return {
        depositParams: {
          minDeposit: R.pathOr<GovParams['depositParams']['minDeposit']>(
            [],
            ['min_deposit'],
            params
          ).map((x) => ({
            denom: x.denom,
            amount: String(x.amount),
          })),
          maxDepositPeriod: R.pathOr(0, ['max_deposit_period'], params),
        },
        tallyParams: {
          quorum: R.pathOr('0', ['quorum'], params),
          threshold: R.pathOr('0', ['threshold'], params),
          vetoThreshold: R.pathOr('0', ['veto_threshold'], params),
        },
        votingParams: {
          votingPeriod: R.pathOr(0, ['voting_period'], params),
        },
      };
    }
    
    // Fallback to old structure
    return {
      depositParams: {
        minDeposit: R.pathOr<GovParams['depositParams']['minDeposit']>(
          [],
          ['depositParams', 'min_deposit'],
          data
        ).map((x) => ({
          denom: x.denom,
          amount: String(x.amount),
        })),
        maxDepositPeriod: R.pathOr(0, ['depositParams', 'max_deposit_period'], data),
      },
      tallyParams: {
        quorum: R.pathOr('0', ['depositParams', 'quorum'], data),
        threshold: R.pathOr('0', ['tallyParams', 'threshold'], data),
        vetoThreshold: R.pathOr('0', ['tallyParams', 'veto_threshold'], data),
      },
      votingParams: {
        votingPeriod: R.pathOr(0, ['votingParams', 'voting_period'], data),
      },
    };
  }
}

export default GovParams;
