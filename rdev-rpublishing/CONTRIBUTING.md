# Development and Design notes for Contributors

Thanks for your interest in contributing!

## Quality Code Style

`shellcheck` is used to determine best practices and is enforced on pull requests. Contributors using vscode are encouraged to install the `shellcheck` extension for vscode to avoid unnecessary pull request denials.

## Object capability (ocap) discipline

The JavaScript and rholang portions of RDev endorses the use of [ocap].  In order to support robust composition and cooperation without vulnerability, code in this project should adhere to [object capability discipline][ocap].

  - **Memory safety and encapsulation**
    - There is no way to get a reference to an object except by
      creating one or being given one at creation or via a message; no
      casting integers to pointers, for example. _JavaScript is safe
      in this way._

      From outside an object, there is no way to access the internal
      state of the object without the object's consent (where consent
      is expressed by responding to messages). _We use `Object.freeze`
      and closures rather than properties on `this` to achieve this._

  - **Primitive effects only via references**
    - The only way an object can affect the world outside itself is
      via references to other objects. All primitives for interacting
      with the external world are embodied by primitive objects and
      **anything globally accessible is immutable data**. There must be
      no `open(filename)` function in the global namespace, nor may
      such a function be imported. _We use a convention
      of only accessing ambient authority inside WARNING sections._

  - **pyrdev Testing framework**
    - pyrdev is in its infancy. It currently does not adhere to ocap
      discipline. Enhancements to the testing framework will be expected
      to remediate this oversight.

[ocap]: http://erights.org/elib/capability/ode/ode-capabilities.html
