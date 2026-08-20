db = db.getSiblingDB('mydb');

const hash = '$2a$10$wY.uV5V988M4xGzV13k72u4xMhQW5j2X.hXh3zW6R.t3k5X/a3vI6';

const mentorId = ObjectId();
const comentorId = ObjectId();
const menteeId = ObjectId();
const groupId = ObjectId();

db.User.insertMany([
  {
    _id: mentorId,
    email: 'mentor@iitp.ac.in',
    name: 'Karan Verma',
    rollNumber: '2401CS01',
    passwordHash: hash,
    role: 'STUDENT',
    smpRole: 'MENTOR',
    coMentorIds: [],
    menteeIds: []
  },
  {
    _id: comentorId,
    email: 'comentor@iitp.ac.in',
    name: 'Priya Sharma',
    rollNumber: '2501CS01',
    passwordHash: hash,
    role: 'STUDENT',
    smpRole: 'CO_MENTOR',
    coMentorIds: [],
    menteeIds: []
  },
  {
    _id: menteeId,
    email: 'mentee@iitp.ac.in',
    name: 'Rahul Sharma',
    rollNumber: '2601CS01',
    passwordHash: hash,
    role: 'STUDENT',
    smpRole: 'MENTEE',
    coMentorIds: [],
    menteeIds: []
  }
]);

db.Group.insertOne({
  _id: groupId,
  academicYear: '2026-2027',
  groupName: 'Group Karan',
  mentorId: mentorId,
  coMentorIds: [comentorId],
  menteeIds: [menteeId]
});

print("Dummy data successfully inserted!");
