import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { fetchChannels } from "../api";

import ChannelFormModal from "../components/ChannelFormModal";
import PageHeader from "../components/PageHeader";

import styles from "./ChannelsPage.module.css";

function formatRate(value) {
  return Number(value ?? 0).toLocaleString(
    "ja-JP",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    },
  );
}

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString(
    "ja-JP",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] =
    useState(null);

  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchChannels();

      setChannels(
        Array.isArray(response.data)
          ? response.data
          : [],
      );
    } catch (err) {
      console.error(err);
      setChannels([]);
      setError(
        "チャネル一覧の取得に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [loadChannels]);

  const showToast = (message) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const openCreateModal = () => {
    setEditingChannel(null);
    setModalOpen(true);
  };

  const openEditModal = (channel) => {
    setEditingChannel(channel);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingChannel(null);
  };

  const handleSaved = async (message) => {
    await loadChannels();
    showToast(message);
  };

  return (
    <div>
      <PageHeader
        title="チャネル管理"
        description="販売先ごとの手数料率や固定費を登録・編集します。"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
          >
            ＋ チャネル登録
          </button>
        }
      />

      {toast && (
        <div
          className="app-feedback app-feedback--success"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast}
        </div>
      )}

      {error && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section
        className={`card ${styles.listPanel}`}
        aria-labelledby="channel-list-title"
        aria-busy={loading}
      >
        <div className={styles.listHeading}>
          <h2 id="channel-list-title">
            チャネル一覧
          </h2>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={loadChannels}
            disabled={loading}
          >
            {loading ? "更新中..." : "更新"}
          </button>
        </div>

        {loading && channels.length === 0 && (
          <div
            className="app-loading-state"
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />

            <span>
              チャネル一覧を読み込んでいます
            </span>
          </div>
        )}

        {!loading &&
          channels.length === 0 &&
          !error && (
            <div className="app-empty-state">
              <p className="app-empty-state__title">
                チャネルが登録されていません
              </p>

              <p className="app-empty-state__description">
                「チャネル登録」から販売先を登録してください。
              </p>
            </div>
          )}

        {channels.length > 0 && (
          <div className={styles.channelList}>
            <div
              className={styles.listHeader}
              aria-hidden="true"
            >
              <span>チャネル名</span>
              <span>手数料率</span>
              <span>固定費</span>
              <span>メモ</span>
              <span>操作</span>
            </div>

            {channels.map((channel) => (
              <article
                key={channel.id}
                className={styles.listRow}
              >
                <div className={styles.nameCell}>
                  <span
                    className={styles.mobileLabel}
                  >
                    チャネル名
                  </span>

                  <strong>{channel.name}</strong>
                </div>

                <div className={styles.numberCell}>
                  <span
                    className={styles.mobileLabel}
                  >
                    手数料率
                  </span>

                  <span>
                    {formatRate(channel.feeRate)}%
                  </span>
                </div>

                <div className={styles.numberCell}>
                  <span
                    className={styles.mobileLabel}
                  >
                    固定費
                  </span>

                  <span>
                    {formatMoney(channel.fixedFee)}円
                  </span>
                </div>

                <div className={styles.noteCell}>
                  <span
                    className={styles.mobileLabel}
                  >
                    メモ
                  </span>

                  <span>
                    {channel.note || "—"}
                  </span>
                </div>

                <div className={styles.actionCell}>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() =>
                      openEditModal(channel)
                    }
                    aria-label={`${channel.name}を編集`}
                  >
                    編集
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ChannelFormModal
        open={modalOpen}
        channel={editingChannel}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}