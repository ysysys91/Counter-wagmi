export const contract = {
  address: '0x1DE08cBea3791aB0ACccf8710d909AAC402dcC46' as const,
  abi: [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'CounterUnderflow',
      type: 'error',
    },
    {
      inputs: [],
      name: 'NotOwner',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint256',
          name: 'newValue',
          type: 'uint256',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'actor',
          type: 'address',
        },
      ],
      name: 'CounterChanged',
      type: 'event',
    },
    {
      inputs: [],
      name: 'decrementCounter',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'incrementCounter',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'resetCounter',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getCounter',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const,
} as const
