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
import { updatePvcYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { useParams } from 'inula-router';

export default function PvcDetailYaml({ pvcYamlProps, isPvcReadyOnly, handleEditFn, refreshFn }) {
  const { pvcName } = useParams();

  const [pvcYaml, setPvcYaml] = useState(pvcYamlProps);

  const [messageApi, contextHolder] = message.useMessage();

  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(pvcYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    exportYamlOutPut(pvcName, pvcYaml);
    messageApi.success('导出成功');
  };

  const handleCancelYaml = () => {
    handleEditFn(true);
    setPvcYaml(pvcYamlProps);
  };

  const handleChangeYaml = (yaml) => {
    setPvcYaml(yaml);
  };

  const handleSaveYaml = async () => {
    let yamlJson = '';
    let errorCount = 0;
    let passNamespace = '';
    let passName = '';
    try {
      yamlJson = yamlTojson(pvcYaml);
      passNamespace = yamlTojson(pvcYamlProps).metadata.namespace; // 默认取之前的命名空间
      passName = yamlJson.metadata.name;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (passNamespace) {
        try {
          const res = await updatePvcYamlData(passNamespace, pvcName, yamlJson);
          if (res.status === ResponseCode.OK) {
            messageApi.success('修改成功');
            setTimeout(() => {
              refreshFn();
              handleEditFn(true);
            }, 1000);
          }
        } catch (pvce) {
          if (pvce.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, pvce);
          } else {
            messageApi.error(`修改失败！${pvce.response.data.message}`);
          }
          setTimeout(() => {
            refreshFn();
          }, 3000);
        }
      }
    }
  };

  const handleResetCode = () => {
    setPvcYaml(pvcYamlProps);
    childCodeMirrorRef.current.resetCodeEditor(pvcYamlProps);
  };

  return <div className="tab_container container_margin_box normal_container_height">
    {contextHolder}
    <div className="yaml_card">
      <div className="yaml_flex_box">
        <h3>{isPvcReadyOnly ? <Fragment>YAML<EditOutlined style={{ color: '#3f66f5', marginLeft: '10px' }} onClick={() => handleEditFn(false)} /> </Fragment> : 'YAML'}</h3>
        <div className="yaml_tools">
          <div className="tool_word_group pvcDetailYamlExport" onClick={handleExportYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group pvcDetailYamlCopy" onClick={handleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className="yaml_space_box">
      <CodeMirrorEditor className={isPvcReadyOnly ? 'no_btn' : ''} yamlData={pvcYaml} changeYaml={handleChangeYaml} isEdit={!isPvcReadyOnly} ref={childCodeMirrorRef} />
      {!isPvcReadyOnly && <div className="resource-storge_btn_footer">
        <Button className="cancel_btn" onClick={handleCancelYaml}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
      </div>}
    </div>
  </div>;
}