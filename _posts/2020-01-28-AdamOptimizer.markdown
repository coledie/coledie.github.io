---
layout: post
author: Cole
title:  "Adam Optimizer: Summary and Python Implementation"
permalink: AdamOptimizer
date:   2020-01-28 1:00:00 -0500
categories: [DL]
tags: [TLDR, Summary, Explination, Crash Course, Deep, Learning, Deep Learning, Neural, Network, Networks, Neural Network, Neural Networks, Optimization, Adam, Adam Optimizer, Stochastic, Gradient, Descent, Gradient Descent, Stochastic, Stochastic Gradient Descent, Python, Numpy]
---
Summary of the paper "Adam: A Method for Stochastic Optimization", an optimization algorithm popular for neural networks. Algorithm shown with python code.

<br>
# What is a the Adam Optimizer?

The Adam Optimizer, which stands for adaptive moment estimation, is an algorithm that uses gradient information from a (possibly noisey)cost function in order to modify the parameters of prediction models in a way that improves performance. This is an optimized version of stochastic gradient descent, building primarily from two other optimizations of SGD:

* [Adagrad](https://databricks.com/glossary/adagrad){:target="_blank"} which updates learning rates on a per parameter basis, via the sum of previous gradient information, an estimation of the first order moment.
* [RMSprop](https://towardsdatascience.com/understanding-rmsprop-faster-neural-network-learning-62e116fcf29a){:target="_blank"} which updates learning rates individually based on a decaying average of the gradient squared over time, an estimation of the second moment of the gradient.

Adam makes use of both first and second order moment of the gradient estimate, calculated with exponentially decaying averages of the gradient and the gradient squared respectively. The moments provide reliable information on the mean and variance of the gradient estimate, which can be used to provide momentum to parameter updates and to scale suggested updates by the quality of information used in the update calculation.

<br>
# How does it work

```python
    """
    Adam Optimizer
    """
    import numpy as np

    theta = [[0.864, 0.980, 0.681, 0.464]]  # List[0] = initial parameters
    f = "stochastic optimization function, f(theta) -> (fitness or cost)"

    m = [[0, 0, 0, 0]]  # Initialize first moment vector
    v = [[0, 0, 0, 0]]  # Initialize second moment vector

    # Convert to ndarray for easy matrix manipulation
    theta, m, v = np.array(theta), np.array(m), np.array(v)

    # While theta not converged
    t = 0
    while theta.shape[0] < 2 or (theta[t] - theta[t-1]) > 10**-3:  
        t += 1

        ## Estimate Error Gradient

        ## Compute Deltas -- Parmeter Changes

        ## Update Parameters
```

Backpropogation algorithms typically have a three steps: error gradient estimation, parameter delta calculation and update application. For the Adam optimizer, those steps are as follows...

#### 1) Error Gradient Estimation

```python
    ## Estimate Error Gradient
    g_t = gradient of f[t](theta[t-1]) with respect to theta  
```

The error gradient is estimated by an objective function f given to the optimizer. The function f is used to determine how far off/how wrong and in which direction each of the outputs of the predictor are. f takes parameters theta, computes the output of a model with the given parameters and returns either the cost or fitness of the model's prediction, ie f(theta)-> scalar. The objective function must be differentiable with respect to theta. Commonly when training neural networks, the mean squared error is used for regression problems and the categorical cross entropy loss is used for classification problems.

#### 2) Delta calculation

```python
    ## Compute Deltas -- Parmeter Changes
    EPSILON = 10^-8  # Prevent division by zero errors

    gamma_1 = .9     # Decay for first moment average
    gamma_2 = .999   # Decay for second moment average

    m_t = gamma_1 * m[t-1] + (1 - gamma_1) * g[t]     # Biased first moment estimate
    v_t = gamma_2 * v[t-1] + (1 - gamma_2) * g[t]**2  # Biased second raw moment estimate

    m, v = np.vstack((m, m_t)), np.vstack((v, v_t))

    # Correct bias in moment estimations
    mhat = m[t] / (1 - (gamma_2)**t)
    vhat = v[t] / (1 - (gamma_2)**t)

    # Signal to noise ratio in direction dictated by mhat
    delta = mhat / (np.sqrt(vhat) + EPSILON)
```

The goal of the delta calculation is to discover how each parameter contributed to the error, and determine how to adjust them accordingly. It must figure out which direction to move any given parameter, commonly taken directly from the gradient, and at what magnitude to shift each parameter, often based on a scaled version of the gradient or some simular heuristic. The Adam optimizer innovates by intelligently solves for the magnitude in which to update the parameters, based on a calculated confidence of gradient estimations.

Adam calculates per-parameter dynamic step sizes based on an exponentially decaying moving average of the gradient and the gradient squared. These averages are the first moment 'm', the biased mean, and second raw moment 'v', the variance of the gradient estimate with respect to the parameters theta. Adam then uses these values to calculate a directioned signal to noise ratio: m / sqrt(v).

* Smaller magnitude Signal-to-Noise ratio means higher uncertainty in gradient estimate, thus a smaller delta value for given parameter.
* High magnitude Signal-to-Noise ratio means gradient estimate is fairly accurate, thus a higher delta to move parameters more significantly.

With these calculations, the mean of the gradient determines which direction the parameter should be moved, because it is the only parameter that may be negative. The variance of the gradient helps determine the confidence of the prediction.




There is one issue with this formulation though, the moving averages of the mean and variance will be biased towards their initial values at the start of training or if decay rates are small. In order to solve this, Adam revises its moment and variance calculations into mhat and vhat respectively. These unbiased estimates are calculated by removing the first terms, v_0 and m_0, from the moving average. It should be possible to skip this step beacause the direction of changes will still be accurate, but it will slow convergence and possibly increase the propability of converging into a local optimum.

#### 3) Update rule

```python
    ## Update Parameters
    alpha = .001  # Learning rate

    theta[t] = theta[t-1] - alpha * delta
```

The update step is where the calculated parameter deltas are scaled by the learning rate, then used to improve parameters theta.

<br>
# Why is Adam good for Neural Networks?

Adam works on differentiable, stochastic objective functions in which a neural network's cost functions are.

Computationally Efficient, it uses only first order gradient calculations(ie first partial derivatives). Second order gradient calculations would require num_parameters ^ 2 calculations to solve for each partial. Given that neural networks have thousands of parameters for even small networks(784 x 32 = 25,000), only first order gradients are feasible.

Low Memory Requirements, because the only information that needs to be stored is first order gradients, equal to the number of parameters. Note, the python code from above could be more memory efficient without changing performance - inneficient for readability.

There are very few hyperparameters: gamma_1, gamma_2 and the learning_rate, all of which are intuitive and should require little tuning.

<br>
# Why Adam is Better than Stochastic Gradient Descent?

Adam works very well in settings where graidents changes a lot, ie complex functions / online learning, because it uses the variance of gradient to manipulate step sizes. Thus, turbulence in the gradient will urge the optimizer to make smaller changes and be more careful.

Adam handles sparse gradients well, ie approaching optimum, because the exponentially decaying moving averages provide a bit of momentum to keep parameters moving while maintaining a slow movement speed. Thus when converging to optimum, it will not overshoot and miss, this is automatic annealing.

<br>
# Sources

["Kingma, Ba. Adam: A Method for Stochastic Optimization". Arxiv. 16 Jan 2020, https://arxiv.org/abs/1412.6980](https://arxiv.org/abs/1412.6980){:target="_blank"}

[Bias correction in Adam](https://stats.stackexchange.com/questions/232741/why-is-it-important-to-include-a-bias-correction-term-for-the-adam-optimizer-for){:target="_blank"}

[AdaGrad Summary](https://databricks.com/glossary/adagrad){:target="_blank"}

[RMSprop Summary](https://towardsdatascience.com/understanding-rmsprop-faster-neural-network-learning-62e116fcf29a){:target="_blank"}

[Backprop Algorithm Comparison](https://www.quora.com/What-are-differences-between-update-rules-like-AdaDelta-RMSProp-AdaGrad-and-AdaM){:target="_blank"}
