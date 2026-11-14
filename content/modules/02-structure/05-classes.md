---
id: structure-05
title: "Classes: data and behaviour together"
minutes: 8
---

A class is a template for things that carry their own data and can do things with it.

- `__init__` runs when you create one.
- `self` is the particular object being worked on.
- A function defined inside a class is called a **method**.

---

```exercise predict
id: structure-05-predict-asset
code: |
  class Asset:
      def __init__(self, name, tris):
          self.name = name
          self.tris = tris

      def is_over(self, budget):
          return self.tris > budget

  rock = Asset("rock_01", 4820)
  crane = Asset("crane_02", 18250)

  print(rock.is_over(9000), crane.is_over(9000))
  crane.tris = 8000
  print(crane.is_over(9000))
output: |
  False True
  False
explain: |
  Each object keeps its own `tris`. Changing `crane.tris` affected only the crane. When you call `crane.is_over(9000)`, Python passes `crane` in as `self`.
```

---

```exercise edit
id: structure-05-edit-label
goal: 'Add a method `label()` so that `rock.label()` returns `"rock_01 (4820 tris)"`.'
code: |
  class Asset:
      def __init__(self, name, tris):
          self.name = name
          self.tris = tris

      def is_over(self, budget):
          return self.tris > budget

  rock = Asset("rock_01", 4820)
check: |
  assert hasattr(rock, "label"), "Asset needs a method called label"
  assert rock.label() == "rock_01 (4820 tris)", "label() should return the name followed by the triangle count in brackets"
solution: |
  class Asset:
      def __init__(self, name, tris):
          self.name = name
          self.tris = tris

      def is_over(self, budget):
          return self.tris > budget

      def label(self):
          return f"{self.name} ({self.tris} tris)"

  rock = Asset("rock_01", 4820)
explain: |
  A method takes `self` first and reads the object's data through it. Indent it to the same level as `is_over`, so it belongs to the class.
```

---

A common slip, especially in hand edits to generated code.

```exercise fix
id: structure-05-fix-self
symptom: Calling `within_limit` on a robot joint stops with a NameError.
code: |
  class Joint:
      def __init__(self, name, limit):
          self.name = name
          self.limit = limit

      def within_limit(self, angle):
          return abs(angle) <= limit

  elbow = Joint("elbow", 90)
check: |
  assert elbow.within_limit(45) is True, "45 degrees is inside the elbow's 90 degree limit"
  assert elbow.within_limit(120) is False, "120 degrees is outside the elbow's 90 degree limit"
solution: |
  class Joint:
      def __init__(self, name, limit):
          self.name = name
          self.limit = limit

      def within_limit(self, angle):
          return abs(angle) <= self.limit

  elbow = Joint("elbow", 90)
cause:
  options:
    - { id: self, text: "`limit` belongs to the object, so it must be read as `self.limit`" }
    - { id: abs, text: "`abs` cannot be used inside a class" }
    - { id: init, text: "`__init__` never ran" }
  answer: self
explain: |
  Inside a method, a bare `limit` is looked up as a local or global name, and there is none. The value was stored on the object, so it is reached through `self`. In C# the `this.` is often implied; in Python it never is.
```

---

## Dataclasses

For classes that mostly hold data, modern Python has a shortcut that writes `__init__` for you. You will see it in a lot of current code:

```python
from dataclasses import dataclass

@dataclass
class Asset:
    name: str
    tris: int
    exported: bool = False
```

---

```exercise predict
id: structure-05-predict-dataclass
code: |
  from dataclasses import dataclass

  @dataclass
  class Product:
      sku: str
      price: float
      in_stock: bool = True

  lamp = Product("LAMP-01", 39.0)
  print(lamp)
  print(lamp == Product("LAMP-01", 39.0))
  print(Product("DESK-02", 210.0, False).in_stock)
output: |
  Product(sku='LAMP-01', price=39.0, in_stock=True)
  True
  False
explain: |
  The dataclass wrote `__init__` from the listed fields, and also a readable printout and an `==` that compares the fields. A plain class would print something like `<__main__.Product object at 0x...>`, and two separate objects would not be equal.
```

---

## When a class is the right tool

- Several functions keep passing the same group of values to each other.
- You have many things of one kind, each with its own state: assets, jobs, nodes, sensors.
- The host requires it. Blender operators and panels are classes. So is every Unity script.

When a function or a plain dictionary does the job, use that. A class with one method is usually a function wearing a costume.

---

```exercise choice
id: structure-05-costume
tag: Judgement call
question: Claude wrote this to total the triangles in a scene. What would you ask for instead?
code: |
  class TriangleCounter:
      def __init__(self, assets):
          self.assets = assets

      def total(self):
          return sum(a["tris"] for a in self.assets)

  print(TriangleCounter(assets).total())
options:
  - { id: function, text: "A plain function, `total_tris(assets)`" }
  - { id: base, text: "A base class so other counters can inherit from it" }
  - { id: keep, text: "Nothing; classes are always more professional" }
answer: function
explain: |
  The class stores one value only to use it in one method. `def total_tris(assets): return sum(...)` does the same with less to read. Extra structure for something used once is a common pattern in generated code, and asking for the simpler version is fair.
```

---

## Reading inheritance

Inheritance builds one class on another. It is worth being able to read, and worth using sparingly.

```exercise predict
id: structure-05-predict-inherit
code: |
  class Sensor:
      def __init__(self, name):
          self.name = name

      def describe(self):
          return f"{self.name}: {self.unit()}"

      def unit(self):
          return "unknown"

  class Thermometer(Sensor):
      def unit(self):
          return "degrees C"

  print(Thermometer("bay_3").describe())
  print(Sensor("bay_4").describe())
output: |
  bay_3: degrees C
  bay_4: unknown
explain: |
  `Thermometer(Sensor)` means it starts with everything `Sensor` has. It inherits `__init__` and `describe`, and replaces `unit`. When `describe` calls `self.unit()`, Python uses the version on the actual object, so the thermometer reports its own unit.
```
