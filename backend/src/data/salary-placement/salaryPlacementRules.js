module.exports = {
  exceptionAreas: ['Student Affairs', 'Basic Needs', 'E3'],
  exceptionOptions: ['No', 'Student Affairs', 'Basic Needs', 'E3', 'Unsure'],
  escalationTriggers: [
    'exception area selected',
    'exception area unsure',
    'no exact position title match',
    'missing pay grade',
    'missing years of experience',
    'new midpoint lower than old midpoint',
    'old midpoint comparison unclear when required'
  ],
  qaChecklist: [
    'Position title matched',
    'Revised pay grade found',
    'Pay grade table matched',
    'Min-to-mid range found',
    'Years of experience entered',
    'Placement math completed',
    'Midpoint cap checked',
    'Exception area checked',
    'Old midpoint comparison checked',
    'Req text generated'
  ],
  oldPayGrades: ['110', '115', '120', '125', '130'],
  reqTextTemplate: [
    'New Pay Grade: {payGrade}',
    'Salary Range: {rangeMinToMid}',
    '',
    'This position has been mapped using the new staff salary placement structure.'
  ].join('\n')
};
