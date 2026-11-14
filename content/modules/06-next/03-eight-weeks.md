---
id: next-03
title: Eight weeks at ten hours a week
minutes: 6
recap: |
  At ten hours a week the course takes eight weeks: two for data, two for structure, one each for debugging, Git and input and output, and one for the capstone. A week is finished when its proof holds, not when the calendar turns, and Git is used from week one so the habit and the history are there before its module.
---

## Weeks 1 to 4

| Week | Focus | Proof you are done |
|---|---|---|
| 1 | Module 1, lessons 1 to 4 | You predict the output of every example correctly |
| 2 | Module 1, lessons 5 and 6, Apply tasks | You can state the shape of a JSON file you have never seen |
| 3 | Module 2, lessons 1 to 3 | You have split one long script into functions |
| 4 | Module 2, lessons 4 to 6, Apply tasks | Some of your logic runs with Blender closed |

---

```exercise choice
id: next-03-proof-week-2
question: Which proof says you have finished week 2?
options:
  - { id: shape, text: "You can state the shape of a JSON file you have never seen" }
  - { id: predict, text: "You predict the output of every example correctly" }
  - { id: split, text: "You have split one long script into functions" }
answer: shape
explain: |
  Week 2 covers nesting and the traps, and the Apply tasks ask you to describe real JSON. A file you have never seen is the honest test, because you cannot have memorised its shape.
```

---

## Weeks 5 to 8

| Week | Focus | Proof you are done |
|---|---|---|
| 5 | Module 3 | You have used the debugger and started a bug journal |
| 6 | Module 4 | A repository with branches, a merge and clear messages |
| 7 | Module 5 | A script that calls an API, and a batch tool with a summary |
| 8 | Capstone | Published |

Use Git from week one, even though its module is week six. Commit every exercise.

---

```exercise choice
id: next-03-git-early
question: Git's module is in week 6. Why start committing in week 1?
options:
  - { id: habit, text: "The habit forms early, and by week 6 you have a real history of your own to practise on" }
  - { id: required, text: "Python will not run files that are not in a repository" }
  - { id: backup, text: "Commits upload your work to the cloud automatically" }
answer: habit
explain: |
  Committing is a small habit that pays off only if it is automatic. Five weeks of real commits also give Module 4 something to work with: your own history, with your own mistakes in it. A commit is local; nothing leaves your computer until you push.
```

---

```exercise choice
id: next-03-behind
tag: Judgement call
question: Week 4 ends, and none of your logic runs with Blender closed yet. What does the table suggest?
options:
  - { id: stay, text: "Stay on week 4 until the proof holds, even if the schedule slips" }
  - { id: move, text: "Move on to Module 3, since the week is over" }
  - { id: restart, text: "Start Module 2 again from lesson 1" }
answer: stay
explain: |
  The proof column is the measure, not the calendar. Moving the rules out of a Blender script is the skill the capstone depends on, so a few extra days here save a week later. Restarting is rarely needed; work on the one proof that is missing.
```

---

## Phone and desk

The lessons suit the phone: five to twenty minutes, a lesson or a short review a day.

The proofs mostly need the desk. Splitting a script, running logic with Blender closed, using the debugger and publishing the capstone all happen on a computer. Plan at least one longer desk session each week.

---

```exercise choice
id: next-03-desk-proof
question: Which part of week 5's proof needs a desk session?
options:
  - { id: debugger, text: "Using the debugger: setting a breakpoint and stepping through a loop" }
  - { id: tracebacks, text: "Reading tracebacks from the bottom" }
  - { id: lessons, text: "Finishing the Module 3 lessons" }
answer: debugger
explain: |
  You can learn to read tracebacks and finish the lessons on the phone. The debugger needs VS Code and a real script, so that proof only comes from a desk session.
```
