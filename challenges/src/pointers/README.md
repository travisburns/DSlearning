# Org chart: everyone points to their manager

**The ticket.** HR's org chart tool stores each employee with a **reference** to their manager (a pointer, in C# terms: every class variable is one). We need the chain of command, and reorganisations must be instant: no copying people around.

**Build** in `OrgChart.cs`:

- `class Employee` with `Name` and `Employee? Manager` (null for the CEO).
- `static List<string> ChainOfCommand(Employee e)`: names from `e` up to the CEO, by following `Manager` references.
- `static void Reassign(Employee e, Employee newManager)`: move `e` (and so everyone under them) to a new manager by changing **one** reference.
- `static bool SamePerson(Employee a, Employee b)`: true only if both variables point to the **same object** (not just the same name).

**Rules.** No copying employees: reorganising changes references only.

**Run:** `dotnet test --filter Lesson=pointers`
