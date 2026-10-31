API development rules

These rules can also be applied to other parts of the project, not just API development.

###

API routes should only have GET and POST methods for simplicity.

Errors are in the format {errorCode: xx, error: "xxx"}, where the first number in the error code specifies which section it is in. Each error code is specific to the request only and can overlap with different meanings. Error descriptions are for documentation purposes only, try to not display them in the frontend.

Reduce indirection as much as possible, AKA don't create unnecessary functions.

Documentation is handled externally. Once you're done, alert the backend lead so they can add it to the spec.

Don't import between views. They should be separate. Any functions used in multiple views should be in the lib folder.

Extension to #3: Avoid displaying anything from the API directly. Add whatever fields and values you need, but put the wording and sentence structure in the frontend instead.

Don't change the API too much. If possible, add a new route instead.

###

Quick summary: Keep it simple.

These rules are updated whenever an incident occurs, as such, existing code may not be reliable enough to use as a reference. Use common sense.
