/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useCallback, useEffect, useState, createRef, Fragment, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { updateServiceYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { useParams } from 'inula-router';

export default function ServiceDetailYaml({ serviceYamlProps, isServiceReadyOnly, handleEditFn, refreshFn }) {
  const { service_name } = useParams();

  const [serviceYaml, setServiceYaml] = useState(serviceYamlProps);

  const [messageApi, contextHolder] = message.useMessage();

  const childCodeMirrorRef = createRef(null);

  const [serviceName, setServiceName] = useState(service_name);

  const themeStore = useStore('theme');

  const handleCopyYaml = () => {
    copy(serviceYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    exportYamlOutPut(serviceName, serviceYaml);
    messageApi.success('导出成功');
  };

  const handleCancelYaml = () => {
    handleEditFn(true);
    setServiceYaml(serviceYamlProps);
  };

  const handleChangeYaml = (yaml) => {
    setServiceYaml(yaml);
  };

  const handleSaveYaml = async () => {
    let yamlJson = '';
    let errorCount = 0;
    let passNamespace = '';
    let passName = '';
    try {
      yamlJson = yamlTojson(serviceYaml);
      passNamespace = yamlTojson(serviceYamlProps).metadata.namespace; // 默认取之前的命名空间
      passName = yamlJson.metadata.name;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (passNamespace) {
        try {
          const res = await updateServiceYamlData(passNamespace, service_name, yamlJson);
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
    }
  };

  const handleResetCode = () => {
    setServiceYaml(serviceYamlProps);
    childCodeMirrorRef.current.resetCodeEditor(serviceYamlProps);
  };

  return <div className="tab_container container_margin_box normal_container_height">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="yaml_card">
      <div className="yaml_flex_box">
        <h3>{isServiceReadyOnly ? <Fragment>YAML<EditOutlined style={{ color: '#3f66f5', marginLeft: '10px' }} onClick={() => handleEditFn(false)} /> </Fragment> : 'YAML'}</h3>
        <div className="yaml_tools">
          <div className="tool_word_group serviceDetailYamlExport" onClick={handleExportYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group serviceDetailYamlCopy" onClick={handleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className="yaml_space_box">
      <CodeMirrorEditor className={isServiceReadyOnly ? 'no_btn' : ''} yamlData={serviceYaml} changeYaml={handleChangeYaml} isEdit={!isServiceReadyOnly} ref={childCodeMirrorRef} />
      {!isServiceReadyOnly && <div className="net_btn_footer">
        <Button className="cancel_btn" onClick={handleCancelYaml}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
      </div>}
    </div>
  </div>;
}