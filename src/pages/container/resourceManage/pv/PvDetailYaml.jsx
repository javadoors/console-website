/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useCallback, useEffect, useState, createRef, Fragment } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { updatePvYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { useParams } from 'inula-router';

export default function PvDetailYaml({ pvYamlProps, isPvReadyOnly, handleEditFn, refreshFn }) {
  const { pvName } = useParams();

  const [pvYaml, setPvYaml] = useState(pvYamlProps);

  const [messageApi, contextHolder] = message.useMessage();

  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(pvYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    exportYamlOutPut(pvName, pvYaml);
    messageApi.success('导出成功');
  };

  const handleCancelYaml = () => {
    handleEditFn(true);
    setPvYaml(pvYamlProps);
  };

  const handleChangeYaml = (yaml) => {
    setPvYaml(yaml);
  };

  const handleSaveYaml = async () => {
    let yamlJson = '';
    let errorCount = 0;
    let passName = '';
    try {
      yamlJson = yamlTojson(pvYaml);
      passName = yamlJson.metadata.name;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      try {
        const res = await updatePvYamlData(pvName, yamlJson);
        if (res.status === ResponseCode.OK) {
          messageApi.success('修改成功');
          setTimeout(() => {
            refreshFn();
            handleEditFn(true);
          }, 1000);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`修改失败！${error.response.data.message}`);
        }
        setTimeout(() => {
          refreshFn();
        }, 3000);
      }
    }
  };

  const handleResetCode = () => {
    setPvYaml(pvYamlProps);
    childCodeMirrorRef.current.resetCodeEditor(pvYamlProps);
  };

  return <div className="tab_container container_margin_box normal_container_height">
    {contextHolder}
    <div className="yaml_card">
      <div className="yaml_flex_box">
        <h3>{isPvReadyOnly ? <Fragment>YAML<EditOutlined style={{ color: '#3f66f5', marginLeft: '10px' }} onClick={() => handleEditFn(false)} /> </Fragment> : 'YAML'}</h3>
        <div className="yaml_tools">
          <div className="tool_word_group pvDetailYamlExport" onClick={handleExportYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group pvDetailYamlCopy" onClick={handleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className="yaml_space_box">
      <CodeMirrorEditor className={isPvReadyOnly ? 'no_btn' : ''} yamlData={pvYaml} changeYaml={handleChangeYaml} isEdit={!isPvReadyOnly} ref={childCodeMirrorRef} />
      {!isPvReadyOnly && <div className="resource-storge_btn_footer">
        <Button className="cancel_btn" onClick={handleCancelYaml}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
      </div>}
    </div>
  </div>;
}