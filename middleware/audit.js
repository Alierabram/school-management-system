const AuditLog = require("../models/AuditLog");

function logAudit(actorEmail, actorRole, action, targetRecord, details) {
  return AuditLog.create({
    actorEmail: actorEmail || "unknown",
    actorRole: actorRole || "Unknown",
    action,
    targetRecord: targetRecord || "",
    details: details || ""
  }).catch(() => {});
}

function auditMiddleware(action, targetFn, detailsFn) {
  return (req, res, next) => {
    res.on("finish", async () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      const target = typeof targetFn === "function" ? targetFn(req, res) : (targetFn || "");
      const details = typeof detailsFn === "function" ? detailsFn(req, res) : (detailsFn || "");
      await logAudit(req.user.email, req.user.role, action, target, details);
    });
    next();
  };
}

module.exports = { logAudit, auditMiddleware };
