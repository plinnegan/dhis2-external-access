import React, { useEffect } from 'react'
import i18n from '@dhis2/d2-i18n'
import classes from './App.module.css'
import { dhis2Connect } from './utils/connectionUtils'

const MyApp = () => {
  useEffect(() => {
    dhis2Connect('https://play.dhis2.org/2.37.3', 'admin', 'district')
  }, [])

  return (
    <div className={classes.container}>
      <h3>{i18n.t('Welcome to DHIS2!')}</h3>
    </div>
  )
}

export default MyApp
