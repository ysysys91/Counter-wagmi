'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'

import { contract } from '@/contract'

import s from './page.module.css'

function shortHex(addr?: string | null, head = 6, tail = 4) {
  if (!addr) return '—'
  if (addr.length <= head + tail + 2) return addr
  return `${addr.slice(0, head + 2)}…${addr.slice(-tail)}`
}

function etherscanAddressUrl(address: string) {
  return `https://sepolia.etherscan.io/address/${address}`
}

function etherscanTxUrl(hash: string) {
  return `https://sepolia.etherscan.io/tx/${hash}`
}

function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const isSepolia = chainId === sepolia.id

  const { connect, status: connectStatus, error: connectError } = useConnect()
  const connectors = useConnectors()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  const [watchEvents, setWatchEvents] = useState(true)
  const [lastAction, setLastAction] = useState<
    'incrementCounter' | 'decrementCounter' | 'resetCounter' | null
  >(null)

  const {
    data: counter,
    isLoading: isCounterLoading,
    error: counterError,
    refetch: refetchCounter,
  } = useReadContract({
    ...contract,
    chainId: sepolia.id,
    functionName: 'getCounter',
    query: { enabled: true },
  })

  const { data: owner } = useReadContract({
    ...contract,
    chainId: sepolia.id,
    functionName: 'owner',
    query: { enabled: true },
  })

  const {
    data: txHash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: sepolia.id,
  })

  const canWrite = isConnected && isSepolia && !isWritePending && !isConfirming

  useEffect(() => {
    if (!isConfirmed) return
    void refetchCounter()
  }, [isConfirmed, refetchCounter])

  useWatchContractEvent({
    ...contract,
    chainId: sepolia.id,
    eventName: 'CounterChanged',
    enabled: watchEvents,
    onLogs: () => {
      void refetchCounter()
    },
  })

  const statusLine = useMemo(() => {
    if (!isConnected) return '지갑을 연결하세요.'
    if (!isSepolia) return 'Sepolia로 네트워크를 변경하세요.'
    if (isSwitchingChain) return '네트워크 변경 중...'
    if (isWritePending) return '트랜잭션 서명 대기 중...'
    if (isConfirming) return '컨펌 대기 중...'
    if (isConfirmed) return '완료됨 (컨펌됨).'
    return '준비됨.'
  }, [
    isConnected,
    isSepolia,
    isSwitchingChain,
    isWritePending,
    isConfirming,
    isConfirmed,
  ])

  const statusTone = useMemo<'ok' | 'warn' | 'busy'>(() => {
    if (!isConnected) return 'warn'
    if (!isSepolia) return 'warn'
    if (isSwitchingChain || isWritePending || isConfirming) return 'busy'
    return 'ok'
  }, [isConnected, isSepolia, isSwitchingChain, isWritePending, isConfirming])

  const badgeToneClass =
    statusTone === 'ok' ? '' : statusTone === 'busy' ? '' : ''

  const readRpc = sepolia.rpcUrls.default.http[0] ?? '—'
  const connectedRpc = isSepolia ? readRpc : '—'

  return (
    <main className={s.page}>
      <div className={s.container}>
        <div className={s.pill}>Sepolia 온체인 카운터</div>
        <h1 className={s.title}>Sepolia 온체인 카운터</h1>
        <p className={s.subtitle}>
          `contract.ts`를 참조해 Sepolia에 배포된 Counter 컨트랙트와 연동합니다.
        </p>

        <hr className={s.hr} />

        <div className={s.table}>
          <div className={s.row}>
            <div className={s.key}>컨트랙트 주소</div>
            <div className={[s.value, s.mono].join(' ')}>
              <a
                className={s.link}
                href={etherscanAddressUrl(contract.address)}
                target="_blank"
                rel="noreferrer"
              >
                {shortHex(contract.address)}
              </a>
            </div>
          </div>
          <div className={s.row}>
            <div className={s.key}>지갑 주소</div>
            <div className={[s.value, s.mono].join(' ')}>
              {shortHex(address)}
            </div>
          </div>
          <div className={s.row}>
            <div className={s.key}>이벤트 구독</div>
            <div className={s.value}>
              <button
                className={s.btn}
                type="button"
                onClick={() => setWatchEvents((v) => !v)}
              >
                {watchEvents ? 'webSocket (HTTP 폴백)' : '꺼짐'}
              </button>
            </div>
          </div>
          <div className={s.row}>
            <div className={s.key}>연결된 RPC</div>
            <div className={[s.value, s.mono].join(' ')}>{connectedRpc}</div>
          </div>
          <div className={s.row}>
            <div className={s.key}>읽기 RPC</div>
            <div className={[s.value, s.mono].join(' ')}>{readRpc}</div>
          </div>
          <div className={s.row}>
            <div className={s.key}>라이브러리</div>
            <div className={[s.value, s.mono].join(' ')}>wagmi/viem</div>
          </div>
        </div>

        <hr className={s.hr} />

        <div className={s.row} style={{ gridTemplateColumns: '1fr auto' }}>
          <div>
            <div className={s.subtitle} style={{ marginTop: 6 }}>
              {statusLine}
            </div>
          </div>
          <div className={s.value}>
            {!isConnected ? (
              connectors.map((connector) => (
                <button
                  key={connector.uid}
                  className={s.btn}
                  type="button"
                  onClick={() => connect({ connector })}
                  disabled={connectStatus === 'pending'}
                >
                  {connector.name} 연결
                </button>
              ))
            ) : (
              <>
                {!isSepolia ? (
                  <button
                    className={s.btn}
                    type="button"
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    disabled={isSwitchingChain}
                  >
                    Sepolia로 변경
                  </button>
                ) : null}
                <button
                  className={s.btn}
                  type="button"
                  onClick={() => disconnect()}
                >
                  연결 해제
                </button>
              </>
            )}
          </div>
        </div>

        <hr className={s.hr} />

        <section className={s.counterCard} aria-label="카운터">
          <div className={s.counterTop}>
            <div className={s.value}>
              {isCounterLoading ? (
                '로딩 중…'
              ) : (
                <span className={s.counter}>
                  {counter?.toString?.() ?? '—'}
                </span>
              )}
            </div>
          </div>

          <div className={s.btnRow}>
            <button
              className={s.btn}
              type="button"
              onClick={() => refetchCounter()}
            >
              새로고침
            </button>
            <button
              className={s.btn}
              type="button"
              disabled={!canWrite}
              onClick={() => {
                setLastAction('decrementCounter')
                writeContract({
                  ...contract,
                  chainId: sepolia.id,
                  functionName: 'decrementCounter',
                })
              }}
            >
              -1
            </button>
            <button
              className={s.btn}
              type="button"
              disabled={!canWrite}
              onClick={() => {
                setLastAction('incrementCounter')
                writeContract({
                  ...contract,
                  chainId: sepolia.id,
                  functionName: 'incrementCounter',
                })
              }}
            >
              +1
            </button>
            <button
              className={s.btn}
              type="button"
              disabled={!canWrite}
              onClick={() => {
                setLastAction('resetCounter')
                writeContract({
                  ...contract,
                  chainId: sepolia.id,
                  functionName: 'resetCounter',
                })
              }}
            >
              Reset (owner)
            </button>
            {txHash ? (
              <a
                className={s.btn}
                href={etherscanTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
              >
                tx 보기
              </a>
            ) : null}
            {txHash ? (
              <button
                className={s.btn}
                type="button"
                onClick={() => {
                  resetWrite()
                  setLastAction(null)
                }}
              >
                tx 상태 초기화
              </button>
            ) : null}
          </div>

          <div className={s.counterMeta}>
            owner: <span className={s.mono}>{owner ?? '—'}</span> · 최근 액션:{' '}
            <span className={s.mono}>{lastAction ?? '—'}</span>
          </div>
        </section>

        {(connectError || writeError || counterError || confirmError) && (
          <div className={s.error}>
            {connectError?.message ||
              writeError?.message ||
              counterError?.message ||
              confirmError?.message}
          </div>
        )}

        <div className={s.footer}>Sepolia 테스트넷 카운터 UI (wagmi/viem)</div>
      </div>
    </main>
  )
}

export default App
