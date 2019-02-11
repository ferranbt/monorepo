declare var ethers;

function getProp(propertyName: string, context: { [key: string]: any }) {
  const location = context.history.location || {};
  const state = location.state || {};
  const query = location.query || {};
  
  return state[propertyName] || query[propertyName] || context[propertyName];
}

/// Returns the commit hash that can be used to commit to chosenNumber
/// using appSalt
function computeCommitHash(appSalt: string, chosenNumber: number) {
  return ethers.utils.solidityKeccak256(
    ["bytes32", "uint256"],
    [appSalt, chosenNumber]
  );
}

export { getProp, computeCommitHash };
