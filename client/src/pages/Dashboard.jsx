import { useEffect, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";

function Dashboard() {
  // Logged-in user
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // Dashboard states
  const [status, setStatus] = useState(
    user?.status || "offline"
  );

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [callHistory, setCallHistory] =
    useState([]);

  const [loadingHistory, setLoadingHistory] =
    useState(true);

  // Active call states
  const [callSeconds, setCallSeconds] =
    useState(0);

  const [notes, setNotes] =
    useState("");

  const [disposition, setDisposition] =
    useState("other");

  // Missed call UI state
  const [
    missedCallNotice,
    setMissedCallNotice,
  ] = useState(null);

  /*
   * ============================
   * FETCH CALL HISTORY
   * ============================
   */

  const fetchCallHistory = async () => {
    try {
      const response = await api.get(
        "/calls/history"
      );

      setCallHistory(
        response.data.calls || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch call history:",
        error
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  /*
   * ============================
   * SOCKET.IO CONNECTION
   * ============================
   */

  useEffect(() => {
    if (!user?.id) return;

    socket.connect();

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "join-agent-room",
        user.id
      );
    };

    const handleIncomingCall = (call) => {
      console.log(
        "Incoming call:",
        call
      );

      // Remove old missed-call message
      setMissedCallNotice(null);

      setIncomingCall(call);
    };

    const handleCallMissed = async ({
      callId,
      customer,
    }) => {
      console.log(
        "Call missed:",
        callId
      );

      /*
       * Only clear current call
       * if this event matches
       * the call currently shown.
       */
      setIncomingCall(
        (currentCall) => {
          if (
            currentCall?._id ===
            callId
          ) {
            return null;
          }

          return currentCall;
        }
      );

      // Show useful missed-call message
      setMissedCallNotice({
        name:
          customer?.name ||
          "Customer",

        phone:
          customer?.phone ||
          "",
      });

      // Refresh history immediately
      await fetchCallHistory();
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    socket.on(
      "call-missed",
      handleCallMissed
    );

    /*
     * If socket was already
     * connected before listener
     * registration, join room now.
     */
    if (socket.connected) {
      socket.emit(
        "join-agent-room",
        user.id
      );
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "incoming-call",
        handleIncomingCall
      );

      socket.off(
        "call-missed",
        handleCallMissed
      );

      socket.disconnect();
    };
  }, [user?.id]);

  /*
   * ============================
   * INITIAL CALL HISTORY
   * ============================
   */

  useEffect(() => {
    fetchCallHistory();
  }, []);

  /*
   * ============================
   * ACTIVE CALL TIMER
   * ============================
   */

  useEffect(() => {
    if (
      !incomingCall ||
      incomingCall.status !==
        "accepted"
    ) {
      setCallSeconds(0);
      return;
    }

    const startedTime =
      incomingCall.startedAt
        ? new Date(
            incomingCall.startedAt
          ).getTime()
        : Date.now();

    const updateTimer = () => {
      const seconds =
        Math.floor(
          (Date.now() -
            startedTime) /
            1000
        );

      setCallSeconds(
        seconds
      );
    };

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        1000
      );

    return () =>
      clearInterval(interval);
  }, [incomingCall]);

  /*
   * Convert seconds to:
   * 65 -> 01:05
   */

  const formatDuration = (
    seconds
  ) => {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remainingSeconds =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  };

  /*
   * ============================
   * CHANGE AGENT STATUS
   * ============================
   */

  const handleStatusChange =
    async (newStatus) => {
      try {
        const response =
          await api.patch(
            "/agents/status",
            {
              status:
                newStatus,
            }
          );

        const updatedStatus =
          response.data.agent
            .status;

        setStatus(
          updatedStatus
        );

        const updatedUser = {
          ...user,
          status:
            updatedStatus,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(
            updatedUser
          )
        );
      } catch (error) {
        console.error(
          "Failed to update status:",
          error
        );
      }
    };

  /*
   * ============================
   * ACCEPT CALL
   * ============================
   */

  const handleAcceptCall =
    async () => {
      try {
        if (
          !incomingCall?._id
        ) {
          return;
        }

        const response =
          await api.patch(
            `/calls/${incomingCall._id}/accept`
          );

        setIncomingCall(
          (previousCall) => ({
            ...previousCall,
            ...response.data
              .call,

            /*
             * Preserve populated
             * customer/agent data
             * received through
             * Socket.IO.
             */
            customer:
              previousCall
                .customer,

            agent:
              previousCall
                .agent,
          })
        );

        setStatus(
          "busy"
        );

        setNotes("");

        setDisposition(
          "other"
        );

        setMissedCallNotice(
          null
        );
      } catch (error) {
        console.error(
          "Failed to accept call:",
          error
        );
      }
    };

  /*
   * ============================
   * REJECT CALL
   * ============================
   */

  const handleRejectCall =
    async () => {
      try {
        if (
          !incomingCall?._id
        ) {
          return;
        }

        await api.patch(
          `/calls/${incomingCall._id}/reject`
        );

        setIncomingCall(
          null
        );

        setMissedCallNotice(
          null
        );

        await fetchCallHistory();
      } catch (error) {
        console.error(
          "Failed to reject call:",
          error
        );
      }
    };

  /*
   * ============================
   * END ACTIVE CALL
   * ============================
   */

  const handleEndCall =
    async () => {
      try {
        if (
          !incomingCall?._id
        ) {
          return;
        }

        const response =
          await api.patch(
            `/calls/${incomingCall._id}/end`,
            {
              notes,
              disposition,
            }
          );

        console.log(
          "Completed call:",
          response.data.call
        );

        setStatus(
          "available"
        );

        setIncomingCall(
          null
        );

        setMissedCallNotice(
          null
        );

        setNotes("");

        setDisposition(
          "other"
        );

        setCallSeconds(
          0
        );

        await fetchCallHistory();
      } catch (error) {
        console.error(
          "Failed to end call:",
          error
        );
      }
    };

  /*
   * ============================
   * LOGOUT
   * ============================
   */

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    socket.disconnect();

    window.location.href =
      "/login";
  };

  /*
   * ============================
   * DASHBOARD CALCULATIONS
   * ============================
   */

  const completedCalls =
    callHistory.filter(
      (call) =>
        call.status ===
        "completed"
    ).length;

  const totalTalkTime =
    callHistory.reduce(
      (total, call) =>
        total +
        (call.durationSeconds ||
          0),
      0
    );

  /*
   * ============================
   * UI
   * ============================
   */

  return (
    <div className="dashboard-layout">
      {/* ====================
          Sidebar
      ==================== */}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            F
          </div>

          <div>
            <strong>
              Falaq
            </strong>

            <span>
              Call Center
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span>◉</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>☎</span>
            Calls
          </button>

          <button className="nav-item">
            <span>◎</span>
            Customers
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(
              0
            ) || "A"}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {user?.name}
            </strong>

            <span>
              {user?.role}
            </span>
          </div>

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
            title="Logout"
          >
            ↗
          </button>
        </div>
      </aside>

      {/* ====================
          Main
      ==================== */}

      <main className="dashboard-main">
        {/* Header */}

        <header className="dashboard-header">
          <div>
            <p className="dashboard-overline">
              AGENT WORKSPACE
            </p>

            <h1>
              Good to see you,{" "}
              {
                user?.name?.split(
                  " "
                )[0]
              }
            </h1>

            <p>
              Manage calls,
              customers and your
              availability from one
              place.
            </p>
          </div>

          <div className="status-control">
            <span
              className={`status-indicator status-${status}`}
            />

            <select
              value={status}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value
                )
              }
            >
              <option value="available">
                Available
              </option>

              <option value="busy">
                Busy
              </option>

              <option value="offline">
                Offline
              </option>
            </select>
          </div>
        </header>

        {/* Stats */}

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">
              Total calls
            </span>

            <strong>
              {
                callHistory.length
              }
            </strong>

            <small>
              Assigned to you
            </small>
          </article>

          <article className="stat-card">
            <span className="stat-label">
              Completed
            </span>

            <strong>
              {completedCalls}
            </strong>

            <small>
              Successfully handled
            </small>
          </article>

          <article className="stat-card">
            <span className="stat-label">
              Talk time
            </span>

            <strong>
              {Math.floor(
                totalTalkTime /
                  60
              )}
              m{" "}
              {totalTalkTime %
                60}
              s
            </strong>

            <small>
              Total conversation
              time
            </small>
          </article>

          <article className="stat-card status-stat-card">
            <span className="stat-label">
              Current status
            </span>

            <strong className="capitalize">
              {status}
            </strong>

            <small>
              Realtime
              availability
            </small>
          </article>
        </section>

        {/* Dashboard Grid */}

        <section className="dashboard-content-grid">
          {/* Live Workspace */}

          <div className="workspace-card">
            <div className="section-heading">
              <div>
                <span className="section-overline">
                  LIVE DESK
                </span>

                <h2>
                  Agent workspace
                </h2>
              </div>

              <span className="live-badge">
                <span />
                Live
              </span>
            </div>

            {/* ====================
                NO CURRENT CALL
            ==================== */}

            {!incomingCall ? (
              missedCallNotice ? (
                /*
                 * Missed call state
                 */
                <div className="missed-call-state">
                  <div className="missed-call-icon">
                    !
                  </div>

                  <span className="missed-label">
                    MISSED CALL
                  </span>

                  <h3>
                    Missed a call
                    from{" "}
                    {
                      missedCallNotice.name
                    }
                  </h3>

                  <p>
                    {
                      missedCallNotice.phone
                    }
                  </p>

                  <button
                    className="dismiss-missed-button"
                    onClick={() =>
                      setMissedCallNotice(
                        null
                      )
                    }
                  >
                    Back to
                    workspace
                  </button>
                </div>
              ) : (
                /*
                 * Normal idle state
                 */
                <div className="empty-call-state">
                  <div className="empty-call-icon">
                    ☎
                  </div>

                  <h3>
                    Ready for
                    conversations
                  </h3>

                  <p>
                    Set yourself to
                    Available and
                    incoming calls
                    assigned to you
                    will appear here
                    instantly.
                  </p>
                </div>
              )
            ) : (
              /*
               * ====================
               * INCOMING / ACTIVE
               * CALL
               * ====================
               */

              <div className="active-call-preview">
                <div className="caller-avatar">
                  {incomingCall
                    .customer
                    ?.name
                    ?.charAt(0) ||
                    "C"}
                </div>

                <span className="incoming-label">
                  {incomingCall.status ===
                  "accepted"
                    ? "CALL CONNECTED"
                    : "INCOMING CALL"}
                </span>

                <h3>
                  {
                    incomingCall
                      .customer
                      ?.name
                  }
                </h3>

                <p>
                  {
                    incomingCall
                      .customer
                      ?.phone
                  }
                </p>

                {/* Ringing */}

                {incomingCall.status ===
                  "ringing" && (
                  <div className="call-actions">
                    <button
                      className="reject-call"
                      onClick={
                        handleRejectCall
                      }
                    >
                      Reject
                    </button>

                    <button
                      className="accept-call"
                      onClick={
                        handleAcceptCall
                      }
                    >
                      Accept call
                    </button>
                  </div>
                )}

                {/* Accepted */}

                {incomingCall.status ===
                  "accepted" && (
                  <div className="connected-call-panel">
                    {/* Timer */}

                    <div className="call-timer">
                      {formatDuration(
                        callSeconds
                      )}
                    </div>

                    {/* Customer details */}

                    <div className="customer-call-details">
                      <div>
                        <span>
                          Email
                        </span>

                        <strong>
                          {incomingCall
                            .customer
                            ?.email ||
                            "Not available"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Direction
                        </span>

                        <strong>
                          Incoming
                        </strong>
                      </div>
                    </div>

                    {/* Notes + Disposition */}

                    <div className="call-form">
                      <div className="call-form-group">
                        <label htmlFor="call-notes">
                          Call notes
                        </label>

                        <textarea
                          id="call-notes"
                          placeholder="Write a short summary of the conversation..."
                          value={
                            notes
                          }
                          onChange={(
                            e
                          ) =>
                            setNotes(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div className="call-form-group">
                        <label htmlFor="disposition">
                          Disposition
                        </label>

                        <select
                          id="disposition"
                          value={
                            disposition
                          }
                          onChange={(
                            e
                          ) =>
                            setDisposition(
                              e.target
                                .value
                            )
                          }
                        >
                          <option value="resolved">
                            Resolved
                          </option>

                          <option value="follow_up">
                            Follow up
                          </option>

                          <option value="not_interested">
                            Not
                            interested
                          </option>

                          <option value="wrong_number">
                            Wrong number
                          </option>

                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>

                      <button
                        className="end-call-button"
                        onClick={
                          handleEndCall
                        }
                      >
                        End call
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ====================
              CALL HISTORY
          ==================== */}

          <div className="history-card">
            <div className="section-heading">
              <div>
                <span className="section-overline">
                  RECENT ACTIVITY
                </span>

                <h2>
                  Call history
                </h2>
              </div>
            </div>

            {loadingHistory ? (
              <p className="history-message">
                Loading calls...
              </p>
            ) : callHistory.length ===
              0 ? (
              <p className="history-message">
                No calls recorded
                yet.
              </p>
            ) : (
              <div className="history-list">
                {callHistory
                  .slice(0, 5)
                  .map(
                    (call) => (
                      <div
                        className="history-item"
                        key={
                          call._id
                        }
                      >
                        <div className="history-avatar">
                          {call.customer?.name?.charAt(
                            0
                          ) ||
                            "C"}
                        </div>

                        <div className="history-details">
                          <strong>
                            {call
                              .customer
                              ?.name ||
                              "Unknown"}
                          </strong>

                          <span>
                            {
                              call.direction
                            }{" "}
                            ·{" "}
                            {
                              call.status
                            }
                          </span>
                        </div>

                        <span className="history-duration">
                          {
                            call.durationSeconds ||
                            0
                          }
                          s
                        </span>
                      </div>
                    )
                  )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;