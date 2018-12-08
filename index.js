// Chris Russell-Walker
// c.russell.walker@gmail.com

/**
    * Validate data entry (age is required and > 0, relationship is required)
    * Add people to a growing household list
    * Remove a previously added person from the list
    * Display the household list in the HTML as it is modified
    * Serialize the household as JSON upon form submission as a fake trip to the server
    * On submission, put the serialized JSON in the provided "debug" DOM element and display that element.
    * After submission the user should be able to make changes and submit the household again.
 */

 /*
 Note about use:
    If you use the quer param debug=true - like so:
    file:///Users/crussellwalker/Desktop/hhbuilder/index.html?debug=true
    This allows you to test the JS validation since we use that to conditional _not_
    add the html5 validation attributes.
 */

// Use IIFE (Immediately invoked function expression) so shared variables won't be on the global scope
(function IIFE() {
    let householdList;
    let hhForm;
    let errorList;
    let relOptions;
    let debugElem;

    // Using as datastore - TODO, use indexedDB instead
    let memberList = [];

    window.onload = () => {

        const params = (new URL(document.location)).searchParams;
        const debug = params.get("debug") === 'true';

        // Get DOM elements
        householdList = document.querySelector('.builder .household');

        hhForm = document.querySelector('.builder form');

        const addButton = document.querySelector('.builder form .add');

        const ageInput = document.querySelector('.builder form input[name=age');

        const relSelect = document.querySelector('.builder form select[name=rel');

        // Create DOM element to hold errors
        errorList = document.createElement('ul');
        hhForm.appendChild(errorList);

        // Get available options from select (and ignore the 'falsy' empty string)
        // .options is an HTMLOptionsCollection not an array hence the spread operator
        relOptions = [...relSelect.options].map(opt => opt.value).filter(optVal => !!optVal);

        // Set hmtl required attributes as "first line of defense"
        // We use the debug param if we want to test the actual form validation
        if (!debug) {
            ageInput.required = true;
            relSelect.required = true;
        }

        // Also set input type on ageInput as another validation deferment to the html where we can
        if (!debug) {
            ageInput.type = 'number';
            ageInput.min = 1;
            ageInput.defaultValue = 1;
        }

        debugElem = document.getElementsByClassName('debug')[0];

        // Attach Event handlers
        addButton.onclick = onAddClick;
        hhForm.onsubmit = onSubmitForm;
    };

    class Member {
        constructor(age, rel, smoker = false) {
            this.age = age;
            this.rel = rel;
            this.smoker = !!smoker;
            this.id = guid();
        }

        display() {
            // Partly used so we don't render the GUID - also nice formatting for display
            return `Age: ${this.age} - Relationship: ${this.rel} - Smoker: ${this.smoker}`;
        }

        save() {
            memberList.push(this);
        }

        static deleteById(memberId) {
            let memberToDelete = memberList.find(member => member.id === memberId);
            let memberIndex = memberList.indexOf(memberToDelete);
            memberList.splice(memberIndex, 1);
        }
    }

    function addErrorsToPage(errors) {
        errors.forEach(errorText => {
            let errorItem = document.createElement('li');
            errorItem.appendChild(document.createTextNode(errorText));
            errorList.appendChild(errorItem);
        });
    }

    function onAddClick(evt) {
        evt.preventDefault();

        clearErrorList();

        const formData = new FormData(hhForm);
        const errors = validateForm(formData);
        if (errors.length) {
            addErrorsToPage(errors);
        } else {
            addMemberToHouseHold(formData);
        }
    };

    function addMemberToHouseHold(formData) {
        const member = new Member(...formData.values());
        member.save();
        addMemberToList(member);
        clearForm();
    };

    function addMemberToList(member) {
        let listItem = document.createElement('li');
        listItem.id = member.id;
        let memberContent = document.createTextNode(member.display());
        listItem.appendChild(memberContent);

        let deleteButton = document.createElement('input');
        deleteButton.type = 'button';
        deleteButton.value = "Delete Household Member";
        deleteButton.dataset.memberId = member.id;
        deleteButton.onclick = deleteButtonClick;
        listItem.appendChild(deleteButton);

        householdList.appendChild(listItem);
    };

    function deleteButtonClick(evt) {
        const memberId = evt.target.dataset.memberId;
        const memberToDelete = document.getElementById(memberId);
        householdList.removeChild(memberToDelete);
        Member.deleteById(memberId);
    }

    function clearForm() {
        // TODO - After clearing form the required html5 attribute is causing the
        // select/dropdown to show that the field is required - maybe use an autofocus on something else?
        hhForm.reset();
        clearErrorList();
    }

    function clearErrorList() {
        while (errorList.firstChild) {
            errorList.removeChild(errorList.firstChild);
        }
    }

    function validateForm(formData) {
        let errors = [];

        let ageVal = formData.get('age');
        ageVal = parseInt(ageVal);
        // TODO - Comment about the NaN check (variable against itself is only ever false when NaN)
        if (ageVal < 0 || ageVal !== ageVal) {
            errors.push('Age is incorrect - must be a number greater than zero.');
        }

        let relVal = formData.get('rel');
        if (!relOptions.includes(relVal)) {
            errors.push(`Relationship value is incorrect - please choose from ${relOptions.join(', ')}`);
        }

        return errors;
    };

    function onSubmitForm(evt) {
        evt.preventDefault();
        if (!memberList.length) {
            addErrorsToPage(['You must have household members before submitting.']);
        } else {
            clearErrorList();
            submitToServer(memberList);
        }
    };

    function submitToServer(memberList) {
        const data = JSON.stringify(memberList)
        debugElem.innerHTML = data;
        debugElem.style.display = 'inherit';
    };

    // Utilities
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
})();
