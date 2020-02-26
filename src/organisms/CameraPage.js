import React, { useState, useEffect, useRef } from "react";
import CameraPhoto, { FACING_MODES } from "jslib-html5-camera-photo";
import gql from "graphql-tag";
import { useLazyQuery, useQuery } from "@apollo/react-hooks";

import styled from "styled-components";
import Spinner from "../atoms/Spinner";

import ClusterResult from "../molecules/ClusterResult";

const Root = styled.div`
  max-width: 575px;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
`;

const StyledVideo = styled.video`
  display: ${({ hidden }) => (hidden ? "none" : "block")}};
`;

export const GET_CLUSTER = gql`
  query Cluster($imageData: String!) {
    getCluster(imageData: $imageData) {
      message
      cluster_name
      cluster
      materials {
        material_id
        description
        long_description
        bin_trash
        bin_recycle
        bin_compost
        dropoff
        pickup
        notes
        image_url
      }
    }
  }
`;

const CameraPage = ({ shutterPress, setAppCluster, toggleSearchFocus }) => {
  const [image, setImage] = useState();
  const videoRef = useRef(null);
  const [cameraInstance, setCameraInstance] = useState();
  const [loading, setLoading] = useState(true);
  const [getCluster, ClusterData] = useLazyQuery(GET_CLUSTER);

  useEffect(() => {
    if (!ClusterData.loading && ClusterData.data) {
      setAppCluster(ClusterData.data.getCluster);
    }
  }, [ClusterData]);

  useEffect(() => {
    if (shutterPress) {
      const config = {
        sizeFactor: 1
      };

      if (cameraInstance) {
        const dataUri = cameraInstance.getDataUri(config);
        setImage({ dataUri });
        cameraInstance.stopCamera();
        getCluster({
          variables: {
            imageData: dataUri
          }
        });
      }
    } else {
      setImage(null);
      setLoading(true);
    }
  }, [shutterPress]);

  useEffect(() => {
    // create video stream
    if (videoRef) {
      const cameraPhoto = new CameraPhoto(videoRef.current);
      setCameraInstance(cameraPhoto);
    }
  }, [videoRef]);

  useEffect(() => {
    const facingMode = FACING_MODES.ENVIRONMENT;

    //set width to height to fix mobile camera
    const height = window.innerWidth > 575 ? 575 : window.innerWidth;
    const idealResolution = {
      height,
      width: window.innerHeight
    };
    if (cameraInstance) {
      cameraInstance
        .startCamera(facingMode, idealResolution)
        .then(() => {
          console.log("camera is started !");
          setLoading(false);
        })
        .catch(error => {
          console.error("Camera not started!", error);
        });
    }

    return function cleanup() {
      if (cameraInstance) {
        cameraInstance.stopCamera();
      }
    };
  }, [cameraInstance, shutterPress]);

  return (
    <Root>
      {loading && <Spinner />}
      <StyledVideo hidden={image || !videoRef} ref={videoRef} autoPlay={true} />
      {image && <img src={image.dataUri} alt="camera image" />}
      {ClusterData && (
        <ClusterResult
          ClusterData={ClusterData}
          toggleSearchFocus={toggleSearchFocus}
        />
      )}
    </Root>
  );
};

export default CameraPage;