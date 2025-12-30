/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */

import { Fragment, useCallback, useEffect, useState, createRef, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant.js';
import { getHelmUpLevelYamlData, getHelmDetailDescriptionData, getHelmTemplateDetailVersion, updateHelmLevelYaml } from '@/api/containerApi';
import { Form, Select, Tabs, Button, message } from 'antd';
import { ResponseCode } from '@/common/constants';
import copy from 'copy-to-clipboard';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import DiffComponent from '@/components/YamlDiff';
import { jsonToYaml, yamlTojson, exportYamlOutPut } from '@/tools/utils';
import { ExportOutlined, CopyOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import extendLogo from '@/assets/images/helmIcon.png';
import '@/styles/pages/extend.less';
import Dayjs from 'dayjs';
import { filterRepeat } from '@/utils/common';

export default function ExtendUpLevel() {
  const param = useParams();

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [levelForm] = Form.useForm();

  const [extendLevelOptions, setExtendLevelOptions] = useState([{ label: '', value: '' }]);

  const [loading, setLoading] = useState(true);

  const [extendLevelTabKey, setExtendLevelTabKey] = useState('1');

  const childCodeMirrorRef = createRef(null);

  const [extendLevelYamlData, setExtendLevelYamlData] = useState();

  const [beforeYamlData, setBeforeYamlData] = useState();

  const [upLevelInfoData, setUpLevelInfoData] = useState({});

  const [extendLevelChartName, setExtendLevelChartName] = useState('');

  const [extendLevelRepoName, setExtendLevelRepoName] = useState('');

  const [loadingExtendButton, setLoadingExtendButton] = useState(true); // 按钮是否禁用

  const themeStore = useStore('theme');

  const [extendVersion, setExtendVersion] = useState('');

  const [extendValue, setExtendValue] = useState('');

  const handleCopy = () => {
    copy(extendLevelYamlData);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    exportYamlOutPut('Values', beforeYamlData);
    messageApi.success('导出成功');
  };

  const handleChangeYaml = (yaml) => {
    setExtendLevelYamlData(yaml);
  };

  // tab切换  
  const handleSetExtendLevelTabKey = (key) => {
    setExtendLevelTabKey(key);
  };

  const handleResetCode = () => {
    setExtendLevelYamlData('');
    getYamlExtendData(extendLevelRepoName, extendLevelChartName);
  };

  const handleExtendYamlOnchange = () => {
    if (extendVersion === levelForm.getFieldValue('version')) {
      setLoading(true);
      setTimeout(() => {
        setBeforeYamlData(extendValue);
        setExtendLevelYamlData(extendValue);
        setLoading(false);
      }, 2000);
    } else {
      getYamlExtendData(extendLevelRepoName, extendLevelChartName);
    }
  };

  // level下拉框内容  接口
  const getLevelExtendOptions = useCallback(async (repo, chart) => {
    try {
      const res = await getHelmTemplateDetailVersion(repo, chart);
      if (res.status === ResponseCode.OK) {
        let _options = [];
        res.data.data.forEach(item => {
          _options.push({ value: item.metadata.version, label: item.metadata.version });
        });
        _options = filterRepeat(_options);
        setExtendLevelOptions([..._options]);
      }
    } catch (e) {
      messageApi.error('获取版本信息失败');
    }
  }, []);

  // 当前yaml数据获取
  const getYamlExtendData = useCallback(async (repo, name) => {
    setLoading(true);
    try {
      const res = await getHelmUpLevelYamlData(repo, name, levelForm.getFieldsValue().version);
      if (res.status === ResponseCode.OK) {
        // 处理原始数据 \r替换为空 保证yaml格式
        let replaceData = res.data.data;
        replaceData['values.yaml'] = replaceData['values.yaml'].replace(/\r/g, '');
        setExtendLevelYamlData(replaceData['values.yaml']);
        setBeforeYamlData(replaceData['values.yaml']);
        setLoading(false);
      }
    } catch (e) {
      messageApi.error('获取yaml失败');
    }
  }, []);

  // 升级详情数据获取
  const getExtendLevelDetail = useCallback(async () => {
    try {
      const res = await getHelmDetailDescriptionData(param.extend_namespace, param.extend_name);
      if (res.status === ResponseCode.OK) {
        setUpLevelInfoData(res.data.data);
        levelForm.setFieldsValue({ version: res.data.data.chart.metadata.version });
        setExtendVersion(res.data.data.chart.metadata.version);
        setExtendValue(jsonToYaml(JSON.stringify(res.data.data.values)));
        setExtendLevelRepoName(res.data.data.labels['openfuyao.io.repo']);
        setExtendLevelChartName(res.data.data.chart.metadata.name);
        // 获取yaml信息
        if (res.data.data.chart.metadata.version === levelForm.getFieldValue('version')) {
          setBeforeYamlData(jsonToYaml(JSON.stringify(res.data.data.values)));
          setExtendLevelYamlData(jsonToYaml(JSON.stringify(res.data.data.values)));
          setLoading(false);
        } else {
          getYamlExtendData(res.data.data.labels['openfuyao.io.repo'], res.data.data.chart.metadata.name);
        }
        // 获取版本信息
        getLevelExtendOptions(res.data.data.labels['openfuyao.io.repo'], res.data.data.chart.metadata.name);
      }
    } catch (e) {
      messageApi.error('数据获取错误', 10);
    }
  }, []);

  const updateExtendYaml = async () => {
    setLoadingExtendButton(false);
    let _data = {
      chartName: upLevelInfoData.chart.metadata.name,
      repoName: upLevelInfoData.labels['openfuyao.io.repo'],
      version: levelForm.getFieldsValue().version,
      values: extendLevelYamlData,
    };
    try {
      const res = await updateHelmLevelYaml(upLevelInfoData.namespace, upLevelInfoData.name, _data);
      if (res.status === ResponseCode.Accepted) {
        messageApi.success('升级成功', 10);
        setTimeout(() => {
          getExtendLevelDetail();
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('升级失败', 10);
      }
    }
    setLoadingExtendButton(true);
  };

  const extendItems = [
    {
      key: '1',
      label: 'Values.yaml',
      children: <div>
        {!loading ? <div className="extend_level_flex_box">
          <h3 className="level_title">YAML（读写）</h3>
          <div className="level_tools">
            <div className="level_tool_word_group" onClick={handleExportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="level_tool_word_group" onClick={handleCopy}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div> : <div></div>}
        <div className="level_yaml_space_box">
          {!loading && <CodeMirrorEditor yamlData={extendLevelYamlData} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />}
        </div>
      </div>,
    },
    {
      key: '2',
      label: '变化',
      children: <div className='extend_diff_box'>
        <DiffComponent diffDataList={[{ oldData: beforeYamlData, newData: extendLevelYamlData, isYamls: true, oldHeader: '旧配置文件', newHeader: '新配置文件' }]} outputFormat={'side-by-side'} />
      </div>,
    },
  ];

  useEffect(() => {
    getExtendLevelDetail();
  }, [getExtendLevelDetail]);

  return <div className='extend_all child_content withBread_content'>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className='extend-tab-top'>
      <BreadCrumbCom items={[
        { title: '扩展组件管理', path: `/${containerRouterPrefix}/extendManage` },
        { title: '详情', path: `/detail/${param.extend_namespace}/${param.extend_name}` },
        { title: '升级', path: `/${containerRouterPrefix}/extendManage/upLevel` }]} />
    </div>
    <div className='extend_uplevel_title'>
      <div style={{ display: 'flex' }}>
        <div><img src={extendLogo} alt="" style={{ height: '30px', width: '30px', marginRight: '8px' }} className='title_image' /></div>
        <div className='uplevel_descript_group'>
          <div style={{ marginRight: '64px' }}>
            <h3 className='uplevel_descript_group_name'>{upLevelInfoData.name}</h3>
          </div>
          <div style={{ marginRight: '64px' }}>
            <p className='uplevel_descript_group_description'>{upLevelInfoData.chart?.metadata?.description}</p>
          </div>
        </div>
      </div>
    </div>
    <div className="extend_uplevel_basic_box">
      <div className="basic_level_card" style={{ padding: '32px 32px 0px 32px', background: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34' }}>
        <h3 className="box_title_h3">当前版本信息</h3>
        <div className="basic_level_card_box">
          <div className="basic_level_card_box_list">
            <div className="basic_level_card_box_list_group">
              <div className="basic_level_card_box_list_single">
                <p className="base_key">应用名称：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{upLevelInfoData.name}</p>
              </div>
              <div className="basic_level_card_box_list_single">
                <p className="base_key">命名空间：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{upLevelInfoData.namespace}</p>
              </div>
            </div>
            <div className="basic_level_card_box_list_group">
              <div className="basic_level_card_box_list_single">
                <p className="base_key">应用模板：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{upLevelInfoData.chart?.metadata?.name}</p>
              </div>
              <div className="basic_level_card_box_list_single">
                <p className="base_key">创建时间：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{Dayjs(upLevelInfoData.info?.firstDeployed).format('YYYY-MM-DD HH:mm')}</p>
              </div>
            </div>
            <div className="basic_level_card_box_list_group">
              <div className="basic_level_card_box_list_single">
                <p className="base_key">模板版本：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{upLevelInfoData.chart?.metadata?.version}</p>
              </div>
              <div className="basic_level_card_box_list_single">
                <p className="base_key">更新时间：</p>
                <p className="base_value" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{Dayjs(upLevelInfoData.info?.lastDeployed).format('YYYY-MM-DD HH:mm')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="extend_level_card">
          <h3 className="box_title_h3">升级信息</h3>
          <Form form={levelForm} layout="vertical" className="extend_level_form">
            <Form.Item label="版本信息" name="version" rules={[
              {
                required: true,
                message: '请选择一个版本!',
              },
            ]} >
              <Select options={extendLevelOptions} className="extend_version_select" onChange={() => handleExtendYamlOnchange()}></Select>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
    <div className="extend_uplevel_box">
      <div className="level_card">
        <h3 className="box_title_h3">参数配置</h3>
        <Tabs items={extendItems} onChange={handleSetExtendLevelTabKey} activeKey={extendLevelTabKey}></Tabs>
      </div>
    </div>
    <div className="level_btn_footer">
      <div className='level_btn_footer_button'>
        <Button className='cancel_btn' onClick={() => history.go(-1)}>取消</Button>
        <Button className={loading ? 'disable_btn' : 'cancel_btn'} disabled={loading} onClick={handleResetCode}>重置</Button>
        {loadingExtendButton ? <Button className={loading ? 'disable_btn' : 'primary_btn'} disabled={loading} onClick={updateExtendYaml}>确定</Button> : <Button className='upLevel_btn' disabled={true}>升级中</Button>}
      </div>
    </div>
  </div>;
}