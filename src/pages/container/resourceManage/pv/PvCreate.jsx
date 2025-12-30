/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/resourceManage.less';
import { useState, createRef, useContext, useEffect } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addPvYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { NamespaceContext } from '@/namespaceContext';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { pvYamlExample } from '@/common/exampleYaml';

export default function PvCreate() {
  const history = useHistory();

  const namespace = useContext(NamespaceContext);

  const [pvYaml, setPvYaml] = useState(pvYamlExample);

  const [pvYamlName, setPvYamlName] = useState('');

  const [messageApi, contextHolder] = message.useMessage();

  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(pvYaml);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    if (pvYamlName) {
      exportYamlOutPut(`Pv`, pvYaml);
    } else {
      exportYamlOutPut(`Pv`, pvYaml);
    }
    messageApi.success('导出成功！');
  };

  const handleChangeYaml = (str) => {
    setPvYaml(str);
  };

  const handleSaveYaml = async () => {
    // YAML转json
    let errorCount = 0;
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(pvYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      try {
        const res = await addPvYamlData(yamlJson);
        if (res.status === ResponseCode.Created) {
          messageApi.success('创建成功');
          setTimeout(() => {
            history.push(`/${containerRouterPrefix}/resourceManagement/pv`);
          }, 2000);
        }
      } catch (pvError) {
        if (pvError.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, pvError);
        } else {
          messageApi.error(`创建失败！${pvError.response.data.message}`);
        }
      }
    }
  };

  const handleResetCode = () => {
    setPvYaml(pvYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(pvYamlExample);
  };

  useEffect(() => {
    setPvYamlName(yamlTojson(serviceYaml).metadata.name);
  }, [pvYaml]);

  return <div className="child_content withBread_content">
    {contextHolder}
    <BreadCrumbCom
      className='create_bread'
      items={[
        { title: '存储', path: `/${containerRouterPrefix}/resourceManagement`, disabled: true },
        { title: '数据卷(PV)', path: `/pv` },
        { title: '创建数据卷(PV)', path: `/createPv` },
      ]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML（读写）</h3>
          <div className="yaml_tools">
            <div className="tool_word_group pvCreateExport" onClick={handleExportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group pvCreateCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={pvYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="resource-storge_btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}