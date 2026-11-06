import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const contractPath = path.resolve('contracts', 'SignatureRegistry.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'SignatureRegistry.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

console.log('Compiling SignatureRegistry.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors && output.errors.length > 0) {
  let hasErrors = false;
  for (const error of output.errors) {
    console.error(error.formattedMessage);
    if (error.severity === 'error') {
      hasErrors = true;
    }
  }
  if (hasErrors) {
    process.exit(1);
  }
}

const contract = output.contracts['SignatureRegistry.sol']['SignatureRegistry'];
const artifact = {
  contractName: 'SignatureRegistry',
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object,
};

// Ensure directories exist
fs.mkdirSync(path.resolve('src', 'contracts'), { recursive: true });
fs.mkdirSync(path.resolve('contracts', 'artifacts'), { recursive: true });

fs.writeFileSync(
  path.resolve('src', 'contracts', 'SignatureRegistry.json'),
  JSON.stringify(artifact, null, 2)
);

fs.writeFileSync(
  path.resolve('contracts', 'artifacts', 'SignatureRegistry.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('Successfully compiled SignatureRegistry.sol and saved artifacts to:');
console.log('  - src/contracts/SignatureRegistry.json');
console.log('  - contracts/artifacts/SignatureRegistry.json');

