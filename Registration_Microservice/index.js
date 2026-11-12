const express = require('express');
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());

const bcrypt = require('bcrypt');
const dbconnect = require('./dbconnect.js');
const StudentModel = require('./student_schema.js');

/*
In Postman use the following URL:
localhost:5003/register/userregister

{
  "Student_name": "Joe",
  "student_email": "joe@gmail.com",
  "student_password": "abc123",
  "student_mobile": 12345678
}
*/

function uniqueid(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1) + min
  );
}

// KEEP GENERATING UNTIL THE STUDENT ID IS NOT ALREADY USED
async function generateStudentId() {
  let id;
  do {
    id = uniqueid(1000, 9999);
  } while (await StudentModel.exists({ Student_id: id }));
  return id;
}

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REG API
app.post('/register/userregister', async (req, res) => {
  console.log("REG API EXECUTED");

  const { Student_name, student_email, student_password, student_mobile } = req.body;

  // STEP 1: VALIDATE INPUT
  if (!Student_name || !student_email || !student_password) {
    return res.status(400).send({ message: 'Student_name, student_email, and student_password are required' });
  }
  if (!EMAIL_REGEX.test(student_email)) {
    return res.status(400).send({ message: 'Invalid email format' });
  }
  if (student_password.length < 6) {
    return res.status(400).send({ message: 'Password must be at least 6 characters' });
  }

  try {
    // STEP 2: CHECK EMAIL (explicit pre-check)
    const existingStudent = await StudentModel.findOne({ student_email: student_email });
    if (existingStudent) {
      return res.status(409).send({ message: 'Email already registered' });
    }

    // STEP 3: HASH PASSWORD
    const hashedPassword = await bcrypt.hash(student_password, SALT_ROUNDS);

    // STEP 4: STORE IN MONGODB
    const studentId = await generateStudentId();

    const sobj = new StudentModel({
      Student_id: studentId,
      Student_name: Student_name,
      student_mobile: student_mobile,
      student_email: student_email,
      student_password: hashedPassword
    });

    await sobj.save();

    // STEP 5: RETURN SUCCESS (with the new id, so you can use it for delete)
    res.status(200).send({
      message: 'DOCUMENT INSERTED IN MONGODB DATABASE',
      Student_id: studentId
    });

  } catch (err) {
    // Safety net: catches the rare race-condition duplicate that slips past findOne
    if (err.code === 11000) {
      return res.status(409).send({ message: 'Email already registered' });
    }
    res.status(500).send({ message: err.message || 'Error in Student Save' });
  }
});

// START THE EXPRESS SERVER. 5003 is the PORT NUMBER
app.listen(5003, '0.0.0.0', () => console.log('EXPRESS Server Started at Port No: 5003'));