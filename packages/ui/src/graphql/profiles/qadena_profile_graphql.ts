// this really doesn't do anything, just here to keep codegen from complaining.  There are no user profiles in Qadena

export const QadenaAverageBlockTimeDocument = /* GraphQL */ `
    query AverageBlockTime {
  averageBlockTime: average_block_time_per_hour(
    limit: 1
    order_by: {height: desc}
  ) {
    averageTime: average_time
  }
}

`;
