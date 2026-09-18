import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import ChannelProfitPanel from "../components/ChannelProfitPanel";
import PageHeader from "../components/PageHeader";

export default function ProfitPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialFrom =
    searchParams.get("from") || "";
  const initialTo =
    searchParams.get("to") || "";

  // 入力欄に表示する日付
  const [fromInput, setFromInput] =
    useState(initialFrom);
  const [toInput, setToInput] =
    useState(initialTo);

  // 実際の集計に使用する日付
  const [appliedPeriod, setAppliedPeriod] =
    useState({
      from: initialFrom,
      to: initialTo,
    });

  const [requestKey, setRequestKey] =
    useState(0);
  const [loading, setLoading] =
    useState(false);
  const [validationError, setValidationError] =
    useState("");

  const submitPeriod = () => {
    if (
      fromInput &&
      toInput &&
      fromInput > toInput
    ) {
      setValidationError(
        "開始日は終了日以前の日付を選択してください",
      );
      return;
    }

    setValidationError("");

    setAppliedPeriod({
      from: fromInput,
      to: toInput,
    });

    // 同じ期間でも「集計」を押せば再取得する
    setRequestKey((current) => current + 1);

    const nextParams = {};

    if (fromInput) {
      nextParams.from = fromInput;
    }

    if (toInput) {
      nextParams.to = toInput;
    }

    setSearchParams(nextParams, {
      replace: true,
    });
  };

  return (
    <div>
      <PageHeader
        title="利益詳細"
        actions={
          <form
            className="row g-2 align-items-end"
            aria-label="利益の集計期間"
            aria-busy={loading}
            onSubmit={(e) => {
              e.preventDefault();
              submitPeriod();
            }}
          >
            <div className="col-12 col-sm-auto">
              <label
                htmlFor="profit-from"
                className="form-label mb-1"
              >
                開始日
              </label>

              <input
                id="profit-from"
                type="date"
                className="form-control"
                value={fromInput}
                onChange={(e) =>
                  setFromInput(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="col-12 col-sm-auto">
              <label
                htmlFor="profit-to"
                className="form-label mb-1"
              >
                終了日
              </label>

              <input
                id="profit-to"
                type="date"
                className="form-control"
                value={toInput}
                onChange={(e) =>
                  setToInput(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="col-12 col-sm-auto d-grid">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "集計中..." : "集計"}
              </button>
            </div>
          </form>
        }
      />

      {validationError && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {validationError}
        </div>
      )}

      <ChannelProfitPanel
        from={appliedPeriod.from}
        to={appliedPeriod.to}
        requestKey={requestKey}
        onLoadingChange={setLoading}
      />
    </div>
  );
}