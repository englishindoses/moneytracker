import { useTranslation } from 'react-i18next'
import { DateInput, MoneyInput, TextInput, TickBox } from './fields'
import { DeleteRowButton } from './DeleteRowButton'
import type { IncomeEntry, IncomePatch } from '../data/types'
import { isIncomeReceived } from '../lib/totals'

interface IncomeRowProps {
  entry: IncomeEntry
  onPatch: (patch: IncomePatch) => void
  onDelete: () => void
}

/** Labels are shown inside each cell on phones and replaced by the table header
 *  at 700px, which is where the row layout flattens into a single ledger line. */
const LABEL = 'cell-label min-[700px]:hidden'

export function IncomeRow({ entry, onPatch, onDelete }: IncomeRowProps) {
  const { t } = useTranslation()
  const received = isIncomeReceived(entry)

  /**
   * Ticking means "the whole expected amount came in", so it fills the received
   * amount and stamps today's date. Unticking clears both — the two directions
   * stay each other's exact inverse, which is what makes the box feel sane.
   */
  function handleTick(checked: boolean) {
    if (checked) {
      onPatch({
        received_amount: entry.expected_amount,
        received_date: entry.received_date ?? new Date().toISOString().slice(0, 10),
      })
    } else {
      onPatch({ received_amount: 0, received_date: null })
    }
  }

  /** Typing the full amount by hand should tick the box too — which it does for
   *  free, since the tick is derived. All this adds is the date stamp. */
  function handleReceivedAmount(value: number) {
    const nowFull = entry.expected_amount > 0 && value >= entry.expected_amount
    onPatch({
      received_amount: value,
      received_date:
        nowFull && !entry.received_date
          ? new Date().toISOString().slice(0, 10)
          : value === 0
            ? null
            : entry.received_date,
    })
  }

  return (
    <li className="row-income sketch-box grid overflow-hidden bg-card px-2 py-2 shadow-sm">
      <div className="[grid-area:name] min-w-0">
        <TextInput
          value={entry.source}
          onCommit={(value) => onPatch({ source: value })}
          label={t('income.source')}
          placeholder={t('income.newSource')}
          className="font-hand text-[1.35rem] min-[700px]:text-[1.2rem]"
        />
      </div>

      <div className="flex min-w-0 items-center gap-1.5 [grid-area:date]">
        <span className={LABEL}>{t('income.date')}</span>
        <div className="min-w-0 flex-1">
          <DateInput
            value={entry.expected_date}
            onCommit={(value) => onPatch({ expected_date: value })}
            label={t('income.date')}
          />
        </div>
      </div>

      {/* Amount cells stack on phones: an inline label would leave the number
          nowhere to go in a fixed-width column. */}
      <div className="flex min-w-0 flex-col [grid-area:expected] min-[700px]:block">
        <span className={`${LABEL} px-2 text-right`}>{t('income.expected')}</span>
        <MoneyInput
          value={entry.expected_amount}
          onCommit={(value) => onPatch({ expected_amount: value })}
          label={t('income.expected')}
        />
      </div>

      <div className="flex min-w-0 flex-col [grid-area:received] min-[700px]:block">
        <span className={`${LABEL} px-2 text-right`}>{t('income.received')}</span>
        <MoneyInput
          value={entry.received_amount}
          onCommit={handleReceivedAmount}
          label={t('income.received')}
          positive
        />
      </div>

      <div className="flex items-center justify-center [grid-area:tick]">
        <TickBox checked={received} onChange={handleTick} label={t('income.receivedTick')} />
      </div>

      <div className="flex min-w-0 items-center gap-1.5 [grid-area:rdate]">
        <span className={LABEL}>{t('income.receivedDate')}</span>
        <div className="min-w-0 flex-1">
          <DateInput
            value={entry.received_date}
            onCommit={(value) => onPatch({ received_date: value })}
            label={t('income.receivedDate')}
          />
        </div>
      </div>

      <div className="flex items-start justify-end [grid-area:del]">
        <DeleteRowButton onConfirm={onDelete} name={entry.source} />
      </div>
    </li>
  )
}
