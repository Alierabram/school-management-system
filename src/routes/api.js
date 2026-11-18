const express = require('express');
const mongoose = require('mongoose');
const authController = require('../controllers/authController');
const recordController = require('../controllers/recordController');
const studentController = require('../controllers/studentController');
const { requireAuth, requireAdmin, requireStudent, requireTeacher, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();
const resources = ['students', 'teachers', 'classes', 'subjects', 'attendance', 'exams', 'results', 'fees', 'feeStructures'];
const resourcePaths = { feeStructures: 'fee-structures' };

/* Public routes */
router.get('/health', (req, res) => res.json({ app: 'School Management System', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
router.get('/auth/me', authController.me);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

/* Everything below requires an authenticated session. */
router.use(requireAuth);

/* ── Student Portal endpoints (STUDENT role only, scoped to own records) ── */
router.get('/me', requireStudent, studentController.meDashboard);
router.get('/me/attendance', requireStudent, studentController.meAttendance);
router.get('/me/report-cards', requireStudent, studentController.meReportCards);
router.get('/me/report-card', requireStudent, studentController.meReportCard);
router.get('/me/fees', requireStudent, studentController.meFees);
router.get('/me/fees/:feeId', requireStudent, studentController.meFeeDetail);
router.get('/me/timetable', requireStudent, studentController.meTimetable);
router.get('/me/assignments', requireStudent, studentController.meAssignments);
router.get('/me/announcements', requireStudent, studentController.meAnnouncements);
router.get('/me/fees/pdf', requireStudent, studentController.exportFeesPDF);
router.get('/me/report-card/pdf', requireStudent, studentController.exportReportCardPDF);

/* ── Administration endpoints (ADMIN role only) ── */
router.get('/dashboard', requireTeacherOrAdmin, recordController.dashboard);
router.post('/attendance/bulk', requireAdmin, recordController.bulkAttendance);
router.post('/results/bulk', requireAdmin, recordController.bulkResults);
router.get('/results/report-card', requireTeacherOrAdmin, recordController.reportCard);
router.put('/results/report-card', requireTeacherOrAdmin, recordController.saveReportComment);
router.get('/fees/outstanding', requireTeacherOrAdmin, recordController.outstandingFees);
router.get('/fees/class-students', requireTeacherOrAdmin, recordController.classStudentsFeeStatus);
router.get('/fees/:id/payments', requireTeacherOrAdmin, recordController.paymentHistory);
router.post('/fees/:id/payments', requireTeacherOrAdmin, recordController.addPayment);

/* Generic CRUD resource routes — ADMIN only. Students have no access here;
   they read their own data through the /api/me/* endpoints above. */
for (const resource of resources) {
  const path = resourcePaths[resource] || resource;
  router.get(`/${path}`, requireTeacherOrAdmin, (req, res) => { req.params.resource = resource; return recordController.list(req, res); });
  router.post(`/${path}`, requireAdmin, (req, res, next) => {
    req.params.resource = resource;
    return resource === 'fees' ? recordController.applyFeeStructure(req, res, () => recordController.create(req, res)) : recordController.create(req, res);
  });
  router.get(`/${path}/:id`, requireTeacherOrAdmin, (req, res) => { req.params.resource = resource; return recordController.get(req, res); });
  router.put(`/${path}/:id`, requireAdmin, (req, res, next) => {
    req.params.resource = resource;
    return resource === 'fees' ? recordController.applyFeeStructure(req, res, () => recordController.update(req, res)) : recordController.update(req, res);
  });
  router.delete(`/${path}/:id`, requireAdmin, (req, res) => { req.params.resource = resource; return recordController.remove(req, res); });
}

router.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
router.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected API error.' });
});

module.exports = router;
