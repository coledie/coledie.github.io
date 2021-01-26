---
layout: post
author: Cole
title:  Object Oriented Programming in Python
permalink: OOPython
date:   2020-02-06 1:00:00 -0500
categories: [Python]
tags: [TLDR, Summary, Explination, Crash Course, Object, Oriented, Object Oriented, Programming, Object Oriented Programming, Python, Numpy]
---
A series of code snippets to help write object oriented code in Python.

<br>
## What is a Object Oriented Programming?

An Object Oriented Program is where the bulk of program functionality is executed by one of more distinct objects. The structure of any given object is defined by a class containing function and variable definitions. Each object may have custom functionality and data associated with it, but the initial structure is given by the class. For example, the blueprint for a Dell Optiplex 7070 could be considered a class, it's a shematic for the functionality of that specific computer. Each created instance of this computer could be considered an object, any modification to one of the objects does not affect the rest.

There are three core pillars of Object Oriented Programming:

* Encapsulation - Each instance of an class may have its own data.
* Inheretance - Classes may inheret methods or variables defined by other classes.
* Polymorphism - One or more classes may inheret the same interface defined by a parent class.

C, Python and Javascript are all object oriented programming languages. Each of these three languages has the capacity to generate object oriented programs. Below, I provide examples in Python that can be used to create object oriented programs.

<br>
## How to Write Object Oriented Code in Python

#### if \__name__ == '\__main__':

Any code written in an "if \__name__ == '\__main__':" main block will only run when the file is directly run, ie 'python main.py'. The code in this block will not run if the file is simply imported by another running file. This is very important in Object Oriented code where a class is typically defined in one file, then imported and used in elsewhere.

```python
if __name__ == '__main__':
    print("This will only run if file is main!")
```

<br>
#### Making a Class

```python
class Neuron:
    pass

if __name__ == '__main__':
    neuron = Neuron()

    Neuron  ## Class
    neuron  ## Object/Instance of class
```

<br>
#### Style: Naming

```python
## Constant, Unchanging Variables
ALL_CAPS = None

## Changing Variables
snake_case = None

## Functions
def snake_case():
    pass

## Classes
class PascalCase:
    pass
```

<br>
#### Style: Documentation

```python
def function(param1:
    """
    A function to demonstrate documentation.

    Parameters
    ----------
    param: int
        This parameter is used for ...

    Returns
    -------
    None This always returns none.
    """
    return None

## Classes
class Class:
    """
    This class can be anything it wants to be.

    Parameters
    ----------
    param: float
        An example constructor parameter.
    """
    def __init__(self, param):
        pass
```

<br>
#### Class Variables

These are variables tied to a class, shared among each instance of the class.

```python
class Neuron:
    RESTING_MV = 0      # Constant: Should not change
    fire_threshold = 1  # Variable: May change


if __name__ == '__main__':
    ## Constant Usage
    neuron1 = Neuron()

    print(Neuron.RESTING_MV)# -> 0
    print(neuron.RESTING_MV)# -> 0

    ## Variable Usage
    neuron1 = Neuron()
    neuron2 = Neuron()

    print(neuron1.fire_threshold)# -> 1
    print(neuron2.fire_threshold)# -> 1

    neuron2.firing_thresh = 12

    print(neuron1.fire_threshold)# -> 12
    print(neuron2.fire_threshold)# -> 12
```

<br>
#### Per-Instance Information & Member Functions

This is data unique to each instance of a class. The 'self' variable, passed by default to every member function of a class, contains all of this object specific information. A member function is just a normal function that is defined within a class and takes self as the first parameter.

```python
class Neuron:
    """
    A generic neuron.

    Parameters
    ----------
    membrane_potential: float
        Initial potential of neuron.
    """
    RESTING_MV = 0
    FIRING_THREHSOLD = 12

    def __init__(self, membrane_potential):
        self.membrane_potential = membrane_potential

    def tick(self):
        """
        See if neuron fires or not at current timestep.
        """
        if self.membrane_potential >= self.FIRING_THREHSOLD:
            self.membrane_potential = Neuron.RESTING_MV

            return 1

        return 0


if __name__ == '__main__':
    neuron1 = Neuron(membrane_potential=0)
    neuron2 = Neuron(membrane_potential=100)

    neuron1.membrane_potential# -> 0
    neuron2.membrane_potential# -> 100

    neuron1.tick()# -> 0
    neuron2.tick()# -> 1
```

<br>
#### Special Methods

Special methods allow the programmer to define class behavior for arithmetic, logic operators and more. [Special Methods List.](https://docs.python.org/3/reference/datamodel.html#special-method-names){:target="_blank"}

```python
class Neuron:
    """
    A generic neuron.
    """
    RESTING_MV = 0

    def __init__(self):
        self.membrane_potential = Neuron.RESTING_MV

    def __iadd__(self, in_mv):
        """
        Update the potential of the neuron.

        Parameters
        ----------
        in_mv: float
            Voltage going into the neuron(in mv).
        """
        self.membrane_potential += in_mv

        return self

    def __ge__(self, firing_threshold):
        """
        See if neuron fires or not at current timestep.

        Parameters
        ----------
        firing_threshold: float
            Voltage that will cause neuron to fire.

        Returns
        -------
        {0, 1} Whether or not the neuron fired at current timestep.
        """
        if self.membrane_potential >= self.firing_threshold:
            self.membrane_potential = Neuron.RESTING_MV

            return 1

        return 0


if __name__ == '__main__':
    FIRING_THRESHOLD = 50
    neuron = Neuron()

    neuron += 100

    print(f"Neuron {'fired' if neuron >= FIRING_THRESHOLD else 'did not fire'}")
```

<br>
#### Class Dictionary

Every class contains a dictionary with each function and variable defined in it. This dictionary can be modified.

```python
class Neuron:
    """
    A generic neuron.
    """
    RESTING_MV = 0
    FIRING_THREHSOLD = 12

    def __init__(self, membrane_potential):
        self.membrane_potential = membrane_potential

    def tick(self):
        """
        See if neuron fires or not at current timestep.
        """
        if self.membrane_potential >= self.FIRING_THREHSOLD:
            self.membrane_potential = Neuron.RESTING_MV

            return 1

        return 0


if __name__ == '__main__':
    neuron = Neuron(membrane_potential=15)

    print(neuron.__dict__)
    """
    {'__module__': '__main__', 'RESTING_MV': 0, 'FIRING_THREHSOLD': 12,
    '__init__': <function Neuron.__init__ at 0x000001EF5CB48E58>, 
    'tick': <function Neuron.tick at 0x000001EF5CB541F8>, '__dict__': 
    <attribute '__dict__' of 'Neuron' objects>, '__weakref__': 
    <attribute '__weakref__' of 'Neuron' objects>, '__doc__': None}
    """
```

<br>
#### Attribute Manipulation

```python
class Neuron:
    """
    A blank slate.
    """


if __name__ == '__main__':
    neuron = Neuron()

    ## See if neuron has attribute
    hasattr(neuron, 'refractory_period')# -> False

    ## Add attribute to neuron and retrieve it
    setattr(neuron, 'refractory_period', 2)
    hasattr(neuron, 'refractory_period')# -> True
    getattr(neuron, 'refractory_period')# -> 2

    ## Manually set neuron attribute
    neuron.refractory_period = 3
    getattr(neuron, 'refractory_period')# -> 3
```

<br>
#### Inheritance

When one class inherets from another, it pulls all functions and class variables into itself. These attributes can either be used directly or overloaded.

```python
class Neuron:
    """
    Parent class.
    """
    RESTING_MV = 0
    FIRING_THRESHOLD = 15

    def __init__(self, membrane_potential):
        self.membrane_potential = membrane_potential

    def __iadd__(self, in_mv):
        self.membrane_potential += in_mv

        return self

    def tick(self):
        if self.membrane_potential >= self.FIRING_THRESHOLD:
            self.membrane_potential = Neuron.RESTING_MV

            return 1

        return 0


class SpikeResponseModel(Neuron):
    """
    Child class.
    """
    POTENTIAL_DECAY = .2

    def __init__(self, membrane_potential):
        super().__init__(membrane_potential)  # Calls Neuron.__init__

    def decay(self):
        self.membrane_potential *= 1 - self.POTENTIAL_DECAY

    def tick(self):  # Overloads Neuron.tick
        self.decay()

        super().tick()  # Calls Neuron.tick


if __name__ == '__main__':
    generic_neuron = Neuron(membrane_potential=0)
    special_neuron = SpikeResponseModel(membrane_potential=0)

    generic_neuron += 15
    special_neuron += 15

    generic_neruon.tick()# -> 1
    special_neuron.tick()# -> 0

```

<br>
#### isinstance / type

Each object in Python has a type. This type is what class was used to structure the object. isinstance tells whether or not an object is an instance of a given class.

```python
class Neuron:
    """
    Parent class.
    """


class SpikeResponseModel(Neuron):
    """
    Child class.
    """
    def decay(self):
        self.


if __name__ == '__main__':
    generic_neuron = Neuron()
    special_neuron = SpikeResponseModel()

    type(generic_neuron)# -> Neuron
    type(special_neuron)# -> SpikeResponseModel

    isinstance(generic_neuron, Neuron)# -> True
    isinstance(special_neuron, Neuron)# -> True

    isinstance(generic_neuron, SpikeResponseModel)# -> False
    isinstance(special_neuron, SpikeResponseModel)# -> True
```

<br>
#### Function Wrapping

Wrapping is when one function is encapsulated in another.

```python
from time import time


def wrapper(func):
    """
    Wrap the given function.
    """
    def timer(*args, **kwargs):
        """
        Time the wrapped function.
        """
        start = time()

        output = func(*args, **kwargs)

        duration = time() - start
        print(f"{func.__name__} took {duration} seconds.")

        return output


def counter(n):
    """
    Count to n.
    """
    for _ in range(n):
        pass


## Wrap counter
counter = wrapper(counter)


if __name__ == '__main__':
    counter()# -> Prints duration of count
```

<br>
#### Function Decorators

Decorators automatically wrap a function with whatever function is used to decorate it.

```python
from time import time


def wrapper(func):
    """
    Wrap the given function.
    """
    def timer(*args, **kwargs):
        """
        Time the wrapped function.
        """
        start = time()

        output = func(*args, **kwargs)

        duration = time() - start
        print(f"{func.__name__} took {duration} seconds.")

        return output


@wrapper # <- Decorator, applies wrap
def counter(n):
    """
    Count to n.
    """
    for _ in range(n):
        pass


if __name__ == '__main__':
    counter()# -> Prints duration of count
```

<br>
#### Static and Class Methods

A class method takes an arbitrary class as the first argument instead of self.

Static methods do not take self as a parameter, they are just used like normal functions.

```python
class Neuron:
    """
    A generic neuron.
    """
    @classmethod
    def copy_from(cls):
        neuron = Neuron()

        for key, value in cls.__dict__.items():
            setattr(neuron, key, value)

        return neuron

    @staticmethod
    def from_file(filename):
        from pickle import load

        with open(filename, 'rb') as file:
            neuron = load(file)

        return neuron


class Demonstration:
    generic_variable = 22

if __name__ == '__main__':
    neuron = Neuron.copy_from(Demonstration)
    isinstance(neuron, Neuron)# -> True

    neuron = Neuron.load('neuron.obj')
    isinstance(neuron, Neuron)# -> True
```

<br>
#### Properties

Properties are functions that can act like normal variables.

```python
class Neuron:
    """
    A generic neuron.
    """
    def __init__(self):
        self._n_access = 0
        self._hidden_variable = .5

    @property
    def public_variable(self):  ## Getter
        self._n_access += 1

        return self._hidden_variable

    @public_variable.setter
    def public_variable(self, value):  ## Setter
        if not isinstance(value, (int, float)):
            return

        self._n_access = 0
        self._hidden_variable = float(value)


if __name__ == '__main__':
    neuron = Neuron()

    # Calling Getter
    print(neuron.public_variable)# -> .5

    # Calling Setter
    neuron.public_variable = 35

    print(neuron.public_variable)# -> 35.0
```
