/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useState, createRef, Fragment, useEffect, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { message, Button } from 'antd';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { updateClusterRoleYamlData } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';

export default function DetailYaml({ roleYamlProps, readOnly, handleEditFn, refreshFn }) {
  const [clusterRoleYaml, setClusterRoleYaml] = useState(roleYamlProps);
  const themeStore = useStore('theme');
  const [clusterRoleFileName, setClusterRoleFileName] = useState('');
  const childCodeMirrorRef = createRef(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleClusterRoleCopyYaml = () => {
    copy(clusterRoleYaml);
    messageApi.success('复制成功！');
  };

  const exportClusterRoleYaml = () => {
    exportYamlOutPut(`${clusterRoleFileName}`, clusterRoleYaml);
    messageApi.success('导出成功');
  };

  useEffect(() => {
    const clusterRoleDetailData = yamlTojson(roleYamlProps);
    setClusterRoleFileName(clusterRoleDetailData.metadata.name);
  }, [roleYamlProps]);

  const handleClusterRoleChangeYaml = (yaml) => {
    setClusterRoleYaml(yaml);
  };

  const handleClusterRoleSaveYaml = async () => {
    let yamlJson = '';
    let errorCount = 0;
    let passName = '';
    try {
      yamlJson = yamlTojson(clusterRoleYaml);
      passName = yamlJson.metadata.name;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      try {
        const res = await updateClusterRoleYamlData(passName, yamlJson);
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
        // 重置yaml
        setTimeout(() => {
          refreshFn();
        }, 1000);
      }
    }
  };

  const handleResetCode = () => {
    setClusterRoleYaml(roleYamlProps);
    childCodeMirrorRef.current.resetCodeEditor(roleYamlProps);
  };

  const handleCodeCancel = () => {
    handleEditFn(true);
    setRoleYaml(roleYamlProps);
  };

  return <div className="tab_container container_margin_box normal_container_height">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="yaml_card cluster_role_card1">
      <div className="yaml_flex_box">
        <h3>{readOnly ? <Fragment>YAML <EditOutlined style={{ color: '#3f66f5' }} onClick={() => handleEditFn(false)} /> </Fragment> : 'YAML'}</h3>
        <div className="yaml_tools">
          <div className="tool_word_group" onClick={exportClusterRoleYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group" onClick={handleClusterRoleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className='yaml_space_box'>
      <CodeMirrorEditor className={readOnly ? 'no_btn' : ''} yamlData={roleYaml} changeYaml={handleClusterRoleChangeYaml} isEdit={!readOnly} ref={childCodeMirrorRef} />
      {!readOnly && <div className="btn_footer">
        <Button className="cancel_btn" onClick={handleCodeCancel}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleClusterRoleSaveYaml}>确定</Button>
      </div>}
    </div>
  </div>;
}