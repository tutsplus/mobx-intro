import React from 'react';
import {observable, autorun, action, computed, reaction, when, runInAction} from 'mobx';
import {observer} from 'mobx-react';

class EventStore {
    @observable startDate = '2017-01-01';
    @observable endDate = '2017-02-01';
    @observable name = 'pavan';

    @observable.ref errors = {};

    @observable pending = false;
    @observable submitted = false;

    @computed get isValid() {
        return this.errors === null;
    }

    init() {
        autorun(() => this.runValidation());

        // reaction(() => {
        //         const {name, startDate, endDate} = this;
        //         return {name, startDate, endDate};
        //     },
        //     () => this.runValidation()
        // );
    }

    runValidation() {
        let errors = null;

        const name = this.name.trim(),
            startDate = this.startDate.trim(),
            endDate = this.endDate.trim();

        if (name === '') {
            errors = Object.assign({}, errors, {name: 'Name is required'});
        }

        if (startDate === '') {
            errors = Object.assign({}, errors, {startDate: 'Start Date is required'});
        }

        if (endDate === '') {
            errors = Object.assign({}, errors, {endDate: 'End Date is required'});
        }

        if (Date.parse(this.startDate) > Date.parse(this.endDate)) {
            errors = Object.assign({}, errors, {
                startDate: 'Start-Date must be before End-Date',
                endDate: 'End-Date must be after Start-Date',
            });
        }

        this.errors = errors;
    }

    @action
    setField(field, value) {
        this[field] = value;
    }

    @action
    submit() {
        this.handleSubmission();

        when(
            () => !this.pending,
            () => {
                if (this.submitted) {
                    console.log('Performing some side effect');
                }
            });
    }

    async handleSubmission() {
        this.pending = true;
        this.submitted = false;

        try {
            const response = await this.makeServiceCall();

            runInAction(() => this.submitted = true);
        } catch (e) {
            runInAction(() => this.submitted = false);
        }
        finally {
            runInAction(() => this.pending = false);
        }
    }

    makeServiceCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.5) {
                    resolve(200);
                } else {
                    reject(500);
                }
            }, 2000);
        });
    }
}
const store = new EventStore();
store.init();

@observer
export class EventForm extends React.Component {

    render() {
        const {errors, name, startDate, endDate, isValid, pending} = store;
        const disabled = !isValid || pending;

        return (
            <section className="pa3">
                <div className="mb3">
                    <label className="db b f6 small-caps">Name</label>
                    <input type="text" className="pa1" value={name}
                           onChange={event => this.onFieldChange('name', event.target.value)}/>
                    {
                        errors && errors.name ? (<Error message={errors.name}/>) : null
                    }

                </div>
                <div className="mb3">
                    <label className="db b f6 small-caps">Start Date</label>
                    <input type="date" className="pa1"
                           value={startDate}
                           onChange={event => this.onFieldChange('startDate', event.target.value)}/>

                    {
                        errors && errors.startDate ? (<Error message={errors.startDate}/>) : null
                    }
                </div>
                <div className="mb3">
                    <label className="db b f6 small-caps">End Date</label>
                    <input type="date" className="pa1"
                           value={endDate}
                           onChange={event => this.onFieldChange('endDate', event.target.value)}/>

                    {
                        errors && errors.endDate ? (<Error message={errors.endDate}/>) : null
                    }
                </div>

                <button
                    className={`pa2 ba br1 b--dark-blue pointer ${disabled ? 'bg-light-gray black-30' : 'bg-blue white'}`}
                    onClick={this.onSubmit}
                    disabled={disabled}>{pending ? 'Submitting...' : 'Submit'}</button>
            </section>
        );
    }

    onFieldChange = (field, value) => {
        store.setField(field, value);
    };

    onSubmit = () => {
        store.submit();
    };
}

function Error({message}) {
    return (
        <div className="red f6">{message}</div>
    );
}
