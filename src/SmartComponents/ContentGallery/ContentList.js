import React, { Component } from 'react';
import { BarLoader } from 'react-spinners';
import propTypes from 'prop-types';
import { Pagination } from '@red-hat-insights/insights-frontend-components/components/Pagination';
import { PageHeader, PageHeaderTitle, Table, TableVariant } from '@red-hat-insights/insights-frontend-components';
import { Bullseye } from '@patternfly/react-core';

const defaultProperty = property => {
  return [].includes(property)
}

const propDetails = item => {
  let details = {};

  for (let property in item) {
    if (item.hasOwnProperty(property) && !defaultProperty(property)) {
      if (item[property] && item[property] !== undefined) {
        details[property] = item[property].toString();
      }
    }
  }
  return details;
};

const itemDetails = props => {
  let details = propDetails(props);
  return (
      <React.Fragment>
        <div>{details}</div>
      </React.Fragment>
  );
};


class ContentList extends Component {
  render() {
    if ( this.props.isLoading || (this.props.items && this.props.items.length) > 0) {
      return (
        <React.Fragment>
          <br />
          <Bullseye>
            <BarLoader color={'#00b9e4'} loading={this.props.isLoading} />
          </Bullseye>
          <div className="pf-l-grid pf-m-gutter">
            { (this.props.items && this.props.items.length > 0) && (
              <Table
                  header={ Object.keys(this.props.items[0])}
                  variant={TableVariant.large}
                  rows={ this.props.items.map( order => { let row = {}; row['cells'] = (Object.values(order)).map(val => {return val===undefined ? '' : val.toString()}); return row;}) }/>)
            }
          </div>
        </React.Fragment>
      );
    }
    else if (!this.props.isLoading) {
      return (
        <React.Fragment>
          <div>
            <PageHeader>
              <PageHeaderTitle title={'No Orders'}/>
            </PageHeader>
          </div>
         </React.Fragment>
      );
    }
  }
}

ContentList.propTypes = {
    isLoading: propTypes.bool,
    items: propTypes.array,
    pageSize: propTypes.number,
    fetchData: propTypes.func
};
export default ContentList;