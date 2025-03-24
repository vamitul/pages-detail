import { Box, Button, MultilineInput, Rows, Scrollable, Text } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import {useState } from "react";
import { openDesign} from "@canva/design";
import { DesignEditing } from "@canva/design";

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

const boxToBounds=({top,left,width,height}) => {
  return [top,left,top+height,left+width];
}

const parseElement = (element: DesignEditing.FixedElement) => {
  const ret:any={
    bounds:boxToBounds(element),
    rotation:element.rotation,
    transparency:element.transparency,
    type:'unknown',
    };
  switch (element.type){
    case 'rect': {
      ret.type='rectangle';
      if (element.fill.color){
        ret.fill=element.fill.color;
      }
      ret.strokeColor = element.stroke?.color;
      ret.strokeWidth = element.stroke?.weight;
      break;
    }
    case 'shape': {
      ret.type='shape';
      viewBox: boxToBounds(element.viewBox);
      paths: element.paths.toArray().map((path) => {
        return {
          d: path.d,
          fill: path.fill.color,
          strokeColor: path.stroke?.color,
          strokeWidth: path.stroke?.weight,
          };
      });
      break;
    }
    case 'group':
      ret.type='group';
      ret.children=element.contents.toArray().map(parseElement);
      break;
    case 'embed':
      ret.type='embed';
      //TODO, add embed specific properties
      break;
    case 'text':
      ret.type='text';
      ret.contents=element.text.readPlaintext();
      ret.ranges=element.text.readTextRegions().map((region) => {
        return {
          contents:region.text,
          appliedFont:region.formatting?.fontRef,
          pointSize: region.formatting?.fontSize,
          fontWeight: region.formatting?.fontWeight,
          fontStyle: region.formatting?.fontStyle,
          underline: region.formatting?.decoration==='underline',
          strikethrough: region.formatting?.strikethrough==='strikethrough',
          alignment:region.formatting?.textAlign,
          fillColor: region.formatting?.color,
          listType: region.formatting?.listMarker,
          listLevel: region.formatting?.listLevel,
        };
      });
      break;
        
    default:
      ret.type='unknown';
      break;
    }
    return ret;
}

const parsePage = (page: DesignEditing.FixedPage) => {
  const pageStructure={
    dimensions: page.dimensions,
    background: page.background?.color,
    elements:page.elements.toArray().map(parseElement)
  };
  return pageStructure;
};

export const App = () => {
  const [elementData,setElementData]= useState("The json data of the element should appaer here");
  const addElement = useAddElement();

  const onClick = () => {
    openDesign({type:'current_page'}, async (design) => {
      console.log(design);
      setElementData(JSON.stringify(parsePage(design.page), null, 2));
    });
  };


  const intl = useIntl();

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="Select one or more elements on the page and hit run to see the magic happen!"
            description="Instructions for how to use the app."
            values={{
              code: (chunks) => <code>{chunks}</code>,
            }}
          />
        </Text>
        <Button variant="primary" onClick={onClick} stretch>
          {intl.formatMessage({
            defaultMessage: "Run",
            })}
        </Button>
        <Box background="surface" border="standard">
          <MultilineInput value={elementData} readOnly={true} autoGrow={true} />
          {/* <Scrollable direction="vertical" indicator={{background:"surface"}}>
            <pre>{elementData}</pre>
            </Scrollable> */}
        </Box>
      </Rows>
    </div>
  );
};
