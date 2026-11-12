const express = require('express');
const app = express();

const dbconnect = require('./dbconnect.js');
const StudentModel = require('./student_schema.js');

/*
In Postman (directly, for local testing):
DELETE localhost:5004/student/delete/1234
(1234 = the Student_id of the student)
*/

// DELETE STUDENT API
app.delete('/student/delete/:id', async (req, res) => {
  console.log("DELETE API EXECUTED");

  // STEP 1: VALIDATE INPUT
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).send({ message: 'Student_id must be a number' });
  }

  try {
    // STEP 2: FIND THE STUDENT BY Student_id AND DELETE IT
    const deletedStudent = await StudentModel.findOneAndDelete({ Student_id: id });

    // STEP 3: NOT FOUND
    if (!deletedStudent) {
      return res.status(404).send({ message: 'Student not found' });
    }

    // STEP 4: RETURN SUCCESS
    res.status(200).send({ message: 'STUDENT DELETED FROM MONGODB DATABASE' });

  } catch (err) {
    res.status(500).send({ message: err.message || 'Error deleting student' });
  }
});

// START THE EXPRESS SERVER. 5004 is the PORT NUMBER
app.listen(5004, '0.0.0.0', () => console.log('Delete Student Server Started at Port No: 5004'));