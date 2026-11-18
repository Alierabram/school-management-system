const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    actorRole: { type: String, enum: ["Registrar", "Accounts", "HOD"], required: true },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "PAYMENT", "BULK_IMPORT", "LOGIN", "LOGOUT", "COURSE_UPDATE", "PRINT"],
      required: true
    },
    targetRecord: { type: String, trim: true, maxlength: 120 },
    details: { type: String, trim: true, maxlength: 500, default: "" },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

auditLogSchema.index({ actorEmail: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
