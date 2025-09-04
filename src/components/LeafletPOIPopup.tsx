import React from 'react'
import { createPortal } from 'react-dom'
import { Popup } from 'react-leaflet'
import EnhancedPOIPopup from './EnhancedPOIPopup'
import { EnhancedPOIData, extractEnhancedPOIData } from '../utils/poiDataUtils'
import { POI } from '../utils/poiUtils'

interface LeafletPOIPopupProps {
  poi: POI
  osmElement?: any
}

const LeafletPOIPopup: React.FC<LeafletPOIPopupProps> = ({ poi, osmElement }) => {
  const enhancedData = extractEnhancedPOIData(poi, osmElement)

  return (
    <Popup
      className="custom-popup"
      maxWidth={400}
      minWidth={300}
      closeButton={true}
      autoClose={false}
      closeOnClick={false}
    >
      <div className="popup-content">
        <EnhancedPOIPopup poiData={enhancedData} />
      </div>
    </Popup>
  )
}

export default LeafletPOIPopup
