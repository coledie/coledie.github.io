---
layout: post
author: Cole
title:  Introduction to Numpy
permalink: IntroNumpy
date:   2020-05-21 1:00:00 -0500
categories: [Python]
tags: [Numpy, Scipy, Python, TLDR, Summary, Explination, Crash Course, Science, Scientific, Scientific Computing, Scientific Programming, Computing, Programming, Intro, Introduction, Summary, Survey, Review, Documentation]
---
A series of code snippets to help make use of Numpy.

<br>
## What is Numpy?

Numpy is a popular Python package that provides developers with statically typed, contiguous memory arrays. It makes working with arrays of high or low dimension significantly easier and faster than pure Python. Numpy is much more widely used than other libraries with the same data structure largely because of its use in the scipy package and its broadcasting feature, which can automatically apply binary operations to arrays of different dimension.

A demonstration of the utility of Numpy,

```python
import numpy as np

def python(N):
    a = list(range(N))

    b = [value + 1 for value in a]

def numpy(N):
    a = np.arange(N)

    b = a + 1

if __name__ == '__main__':
    from timeit import timeit

    N = 1000000

    print(timeit(lambda: python(N), number=1))
    print(timeit(lambda: numpy(N), number=1))

    #>>> .134
    #>>> .006
```

Pure Python takes .134 seconds while Numpy takes .006 seconds, 22x speed increase!

<br>
## How to use Numpy

<br>
### Installation

To install on your local machine, open a terminal and type,

Windows/Mac:

```bash
python -m pip install numpy
```

Linux:

```bash
python3 -m pip install numpy
```

<br>
### Importing

At the top of any Python script,

```python
import numpy as np
```

<br>
### Creating ndarrays

Any iterable can be passed into np.array() to be transformed into a ndarray as long as all values are of the same data type.

```python
x = np.array(['a', 'b', 'c'])
print(x)

>>> array(['a', 'b', 'c'], dtype='<U1')
```

Numpy version of range, generates an ndarray instead

```python
x = np.arange(start=0, stop=3, step=1)
print(x)

>>> array([0, 1, 2])
```

np.arange allows for non integer step sizes

```python
x = np.arange(start=0, stop=1, step=.1)
print(x)

>>> array([0. , 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
```

Many functions to quickly create arrays exist

```python
x = np.zeros(shape=6)
print(x)

>>> array([0. 0. 0. 0. 0. 0.])
```

Generating n dimensional is usually done by passing a tuple
into an array generation function.

```python
x = np.zeros(shape=(3, 5))
print(x)

>>> array([[0., 0., 0., 0., 0.],
        [0., 0., 0., 0., 0.],
        [0., 0., 0., 0., 0.]])
```

Numpy can generate large amounts of random numbers very quickly

```python
x = np.random.uniform(0, 1, size=10)
print(x)

>>> array([0.48908712, 0.21474925, 0.71589095, 0.74606879, 0.0992887 ,
        0.33601409, 0.41361811, 0.85178078, 0.21592613, 0.8155579 ])
```

<br>
### Reshaping ndarrays

```python
x = np.arange(1, 13)
print(x)

>>> array([ 1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12])
```

Reshape by passing tuple w/ (n_rows, n_cols)

```python
y = x.reshape((3, 4))
print(y)

>>> array([[ 1,  2,  3,  4],
        [ 5,  6,  7,  8],
        [ 9, 10, 11, 12]])
```

Transpose matrix

```python
x = x.T
print(x)

>>> array([[ 1,  5,  9],
        [ 2,  6, 10],
        [ 3,  7, 11],
        [ 4,  8, 12]])
```

If -1 is used for the size of any dimension, it will
be automatically set to whatever value is needed to
successfully reshape the array.

```python
x = np.random.power(7, size=4)
print(x)

>>> array([0.73801263, 0.8526897 , 0.88994279, 0.93148266])

print(x.T)

>>> array([0.73801263, 0.8526897 , 0.88994279, 0.93148266])

print(x.reshape((-1, 1)))

>>> array([[0.73801263],
        [0.8526897 ],
        [0.88994279],
        [0.93148266]])
```

<br>
### Combining ndarrays

```python
a = np.arange(6)
b = a.reshape((2, -1))
print(a)
print(b)

>>> array([0, 1, 2, 3, 4, 5])
>>> array([[0, 1, 2],
        [3, 4, 5]])
```

Concatenate essentially glues arrays together along axis

```python
x = np.concatenate((b, b), axis=0)
print(x)

>>> array([[0, 1, 2],
        [3, 4, 5],
        [0, 1, 2],
        [3, 4, 5]])

x = np.concatenate((b, b), axis=1)
print(x)

>>> array([[0, 1, 2, 0, 1, 2],
        [3, 4, 5, 3, 4, 5]])
```

vstack is an alias to concatenate: axis=0

```python
x = np.vstack((b, b))
print(x)

>>> array([[0, 1, 2],
        [3, 4, 5],
        [0, 1, 2],
        [3, 4, 5]])
```

hstack is an alias to concatenate: axis=1

```python
x = np.hstack((b, b))
print(x)

>>> array([[0, 1, 2, 0, 1, 2],
        [3, 4, 5, 3, 4, 5]])
```

<br>
### Indexing & Slicing ndarrays
[row, column, channel]

```python
x = np.arange(12).reshape((3, 4))
print(x)

>>> array([[ 0,  1,  2,  3],
        [ 4,  5,  6,  7],
        [ 8,  9, 10, 11]])

print(x[1, 2])

>>> 6

x = np.arange(12).reshape((2, 2, 3))
print(x)

>>> array([[[ 0,  1,  2],
         [ 3,  4,  5]],

        [[ 6,  7,  8],
         [ 9, 10, 11]]])

print(x[0, 1, 2])

>>> 5
```

Multiple indexing, passing a list instead of an int

Note: values are returned as ndarray

```python
x = np.arange(0, 18, 3)
print(x)

>>> array([ 0,  3,  6,  9, 12, 15])

print(x[[1, 3, 5]])

>>> array([ 3,  9, 15])
```

np.where generates indexing matrix based on what values are true
in given matrix

```python
x = np.arange(10).reshape((2, -1))
print(x)

>>> array([[0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9]])

is_odd = x % 2

>>> array([[0, 1, 0, 1, 0],
        [1, 0, 1, 0, 1]], dtype=int32)

locs = np.where(is_odd)
print(locs)

>>> (array([0, 0, 1, 1, 1], dtype=int64), array([1, 3, 0, 2, 4], dtype=int64))

print(x[locs])

>>> array([1, 3, 5, 7, 9])
```

Slicing, the same as pure python with multiple dimensions.

```python
x = np.arange(5)
print(x)

>>> array([0, 1, 2, 3, 4])

print(x[::1])

>>> array([0, 1, 2, 3, 4])

print(x[::2])

>>> array([0, 2, 4])

print(x[::-1])

>>> array([4, 3, 2, 1, 0])

x = np.arange(5) + np.arange(5).reshape((-1, 1))
print(x)

>>> array([[0, 1, 2, 3, 4],
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
        [3, 4, 5, 6, 7],
        [4, 5, 6, 7, 8]])

print(x[1:4])

>>> array([[1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
        [3, 4, 5, 6, 7]])

print(x[:, 1:4])

>>> array([[1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
        [4, 5, 6],
        [5, 6, 7]])

print(x[1:4, 1:4])

>>> array([[2, 3, 4],
        [3, 4, 5],
        [4, 5, 6]])
```


<br>
### Memory Nuances

Slicing and indexing values of ndarray return actual
memory locations that can be used to modify original

```python
a = np.arange(10).reshape((2, 5))
print(a)

>>> array([[0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9]])

b = a[::-1, ::-1]
print(b)

>>> array([[9, 8, 7, 6, 5],
        [4, 3, 2, 1, 0]])

a[0] += 1
print(a)

>>> array([[1, 2, 3, 4, 5],
        [5, 6, 7, 8, 9]])

print(b)

>>> array([[9, 8, 7, 6, 5],
        [5, 4, 3, 2, 1]])
```

np.copy is a quick way to remove this issue

```python
a = np.arange(10).reshape((2, 5))
print(a)

>>> array([[0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9]])

b = np.copy(a)[::-1, ::-1]
print(b)

>>> array([[9, 8, 7, 6, 5],
        [4, 3, 2, 1, 0]])

a[0] += 1
print(a)

>>> array([[1, 2, 3, 4, 5],
        [5, 6, 7, 8, 9]])

print(b)

>>> array([[9, 8, 7, 6, 5],
        [4, 3, 2, 1, 0]])
```

<br>
### Broadcasting

Broadcasting is numpy's way of performing operations between
arrays with different numbers of dimensions.

Array - Scalar operation

```python
x = np.ones(shape=3) * 6
print(x)

>>> array([6., 6., 6.])
```

Adding vector a with shape (1, 3) and b with shape (3, 1) = 
x with shape (3, 3)

```python
a = np.arange(3)
b = np.arange(3).reshape((-1, 1))
print(a)

>>> array([0, 1, 2])

print(b)

>>> array([[0],
        [1],
        [2]])

x = a + b
print(x)

>>> array([[0, 1, 2],
        [1, 2, 3],
        [2, 3, 4]])
```

Longer demonstration

```python
x = np.array([-3, 0, 3]) + np.zeros(shape=(3, 1))
print(x)

>>> array([[-3.,  0.,  3.],
        [-3.,  0.,  3.],
        [-3.,  0.,  3.]])

y = np.array([-10, 0, 10])
print(y)

>>> array([-10,   0,  10])

print(x * y)

>>> array([[30.,  0., 30.],
        [30.,  0., 30.],
        [30.,  0., 30.]])

y = y.reshape((-1, 1))
print(y)

>>> array([[-10],
        [  0],
        [ 10]])

print(x * y)

>>> array([[ 30.,  -0., -30.],
        [ -0.,   0.,   0.],
        [-30.,   0.,  30.]])
```

Arithmetic operations, comparisons and set equal are broadcastable operations.

```python
x = np.arange(5) + np.zeros(shape=(3, 1))
print(x)

>>> array([[0., 1., 2., 3., 4.],
        [0., 1., 2., 3., 4.],
        [0., 1., 2., 3., 4.]])

y = np.array([[1], [2], [3]])
print(y)

>>> array([[1],
        [2],
        [3]])

z = x + y
print(z)

>>> array([[1., 2., 3., 4., 5.],
        [2., 3., 4., 5., 6.],
        [3., 4., 5., 6., 7.]])
```

~ inverts boolean values

```python
idx = ~np.bool_(z % 2)
print(idx)

>>> array([[False,  True, False,  True, False],
        [ True, False,  True, False,  True],
        [False,  True, False,  True, False]])

z[idx] = 0
print(z)

>>> array([[1., 0., 3., 0., 5.],
        [0., 3., 0., 5., 0.],
        [3., 0., 5., 0., 7.]])

crosshatch = z / z
print(crosshatch)

>>> array([[ 1., nan,  1., nan,  1.],
        [nan,  1., nan,  1., nan],
        [ 1., nan,  1., nan,  1.]])

crosshatch[np.isnan(crosshatch)] = 0
print(crosshatch)

>>> array([[1., 0., 1., 0., 1.],
        [0., 1., 0., 1., 0.],
        [1., 0., 1., 0., 1.]])
```

<br>
### Numpy Statistics

```python
x = np.random.normal(loc=12, size=10000)
print(np.mean(x))

>>> 12.004210965789426

x = np.random.randint(0, 100, size=100000)
print(np.median(x))

>>> 49.0
```

<br>
### Masked Arrays

```python
# ma.array(data[any], mask[bool], fill_value[any])
# - Mask is boolean array, data is masked where true.
# - Fill_value determines what value is used in place of masked values.

x = np.ma.array(np.arange(10), mask=[False] * 10)
print(x)

>>> masked_array(data=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
              mask=[False, False, False, False, False, False, False, False,
                    False, False],
        fill_value=999999)

x.mask[np.where(x % 2)] = True
print(x)

>>> masked_array(data=[0, --, 2, --, 4, --, 6, --, 8, --],
              mask=[False,  True, False,  True, False,  True, False,  True,
                    False,  True],
        fill_value=999999)

print(x >= 0)

>>> masked_array(data=[True, --, True, --, True, --, True, --, True, --],
              mask=[False,  True, False,  True, False,  True, False,  True,
                    False,  True],
        fill_value=999999)

print(np.sum(x))

>>> 20
```

<br>
### General Functions

```python
a = list(range(5))
print(a)

>>> [0, 1, 2, 3, 4]

b = a[::-1]
print(b)

>>> [4, 3, 2, 1, 0]

for i, value in enumerate(b):
    a[i] += value

print(a)

>>> [4, 4, 4, 4, 4]

a = np.arange(10).reshape((2, 5))
print(a)

>>> array([[0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9]])

b = np.copy(a)[::-1, ::-1]
print(b)

>>> array([[9, 8, 7, 6, 5],
        [4, 3, 2, 1, 0]])

for idx, value in np.ndenumerate(b):  # n dimensional enumerate, idx=tuple
    a[idx] += value

print(a)

>>> array([[9, 9, 9, 9, 9],
        [9, 9, 9, 9, 9]])

x = np.arange(12).reshape((2, 2, 3))
print(x)

>>> array([[[ 0,  1,  2],
         [ 3,  4,  5]],

        [[ 6,  7,  8],
         [ 9, 10, 11]]])

print(np.ravel(x))

>>> array([ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11])

x = np.arange(7)
print(x)

>>> array([0, 1, 2, 3, 4, 5, 6])

y = np.minimum(x, x[::-1])
print(y)

>>> array([0, 1, 2, 3, 2, 1, 0])

print(np.argmax(y))  # -> index of max value

>>> 3
```

<br>
## Practice Problem

### Monte Carlo Search on Craps

**Game Rules**

Roll 2 dice and sum values.

<br>
Part 1: First roll

Win if roll 7 or 11

Loose if roll 2, 3 or 12

Go onto Part 2 if did not win or loose

<br>
Part 2: Roll until win/loose

Win if re-roll number from part 1

Loose if roll 7

Roll again if did not win or loose

<br>
**Goal**

A monte carlo search is a brute force method that can be used to find 
the probability that a given player will win craps. Using Numpy, you 
can simulate 1 million trials of the game quickly, with two arrays.

<br>
[**Solution Code**](https://github.com/coledie/Monte-Carlo-Simulation)

<br>
## Other Resources

[Numpy Documentation](https://docs.scipy.org/doc/)

[Numpy Book](https://docs.scipy.org/doc/\_static/numpybook.pdf)
