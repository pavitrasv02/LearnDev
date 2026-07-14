const Certificate = require("../models/Certificate");

// GET /api/certificates — my certificates
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({ user: req.user._id })
      .populate("course", "title slug thumbnail category level")
      .sort({ issuedAt: -1 });
    res.json({ success: true, certificates: certs });
  } catch (err) {
    next(err);
  }
};

// GET /api/certificates/:id — single certificate (owner only)
exports.getCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("course", "title slug thumbnail category level duration instructor");
    if (!cert) return res.status(404).json({ success: false, message: "Certificate not found" });
    if (cert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    res.json({ success: true, certificate: cert });
  } catch (err) {
    next(err);
  }
};

// GET /api/certificates/verify/:code — public verification endpoint
exports.verifyCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ verificationCode: req.params.code })
      .populate("course", "title category level instructor");
    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found or invalid" });
    }
    res.json({
      success: true,
      valid: true,
      certificate: {
        studentName: cert.studentName,
        courseTitle: cert.courseTitle,
        instructorName: cert.instructorName,
        issuedAt: cert.issuedAt,
        verificationCode: cert.verificationCode,
        course: cert.course,
      },
    });
  } catch (err) {
    next(err);
  }
};
