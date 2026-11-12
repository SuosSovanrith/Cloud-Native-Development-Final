const mongoose = require('mongoose');

const StudentSchema = mongoose.Schema(
    {
        Student_id: { type: Number, required: true, unique: true },
        Student_name: { type: String, required: true },
        student_mobile: { type: Number },
        student_email: { type: String, required: true, unique: true },
        student_password: { type: String, required: true }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('student_collection', StudentSchema);