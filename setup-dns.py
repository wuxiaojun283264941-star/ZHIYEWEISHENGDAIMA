#!/usr/bin/env python3
"""阿里云 DNS AAAA 记录配置 + DDNS 脚本部署"""
import json
import sys
import os

# ============ 配置 ============
ACCESS_KEY_ID = os.environ.get('ALI_AK_ID', '')
ACCESS_KEY_SECRET = os.environ.get('ALI_AK_SECRET', '')
DOMAIN = 'lvhuianquan.icu'
NAS_IPV6 = '2409:8a20:6611:ab90:cb3:73ff:fec9:394d'

# NAS SSH
NAS_HOST = '100.66.1.6'
NAS_PORT = 6884
NAS_USER = 'wuxiaojun66'
NAS_PWD = 'wu@xj123'

def setup_dns_record():
    """添加 AAAA 记录到阿里云 DNS"""
    from aliyunsdkcore.client import AcsClient
    from aliyunsdkalidns.request.v20150109.DescribeDomainRecordsRequest import DescribeDomainRecordsRequest
    from aliyunsdkalidns.request.v20150109.AddDomainRecordRequest import AddDomainRecordRequest
    from aliyunsdkalidns.request.v20150109.DeleteDomainRecordRequest import DeleteDomainRecordRequest

    client = AcsClient(ACCESS_KEY_ID, ACCESS_KEY_SECRET, 'cn-hangzhou')

    # 1. 查询现有记录
    print('>>> 查询现有 DNS 记录...')
    req = DescribeDomainRecordsRequest()
    req.set_DomainName(DOMAIN)
    req.set_RRKeyWord('@')
    req.set_TypeKeyWord('AAAA')
    resp = client.do_action_with_exception(req)
    data = json.loads(resp)
    records = data.get('DomainRecords', {}).get('Record', [])
    
    print(f'    找到 {len(records)} 条 AAAA 记录')
    for r in records:
        print(f'    - {r["RR"]}.{DOMAIN} -> {r["Value"]} (ID: {r["RecordId"]})')

    # 2. 删除旧的 AAAA @ 记录（如果存在）
    for r in records:
        if r['RR'] == '@':
            print(f'>>> 删除旧记录 {r["RecordId"]}...')
            del_req = DeleteDomainRecordRequest()
            del_req.set_RecordId(r['RecordId'])
            client.do_action_with_exception(del_req)
            print('    已删除')

    # 3. 添加新的 AAAA 记录
    print(f'>>> 添加 AAAA 记录: {DOMAIN} -> {NAS_IPV6}')
    add_req = AddDomainRecordRequest()
    add_req.set_DomainName(DOMAIN)
    add_req.set_RR('@')
    add_req.set_Type('AAAA')
    add_req.set_Value(NAS_IPV6)
    add_req.set_TTL(600)  # 10分钟TTL，方便DDNS更新
    resp = client.do_action_with_exception(add_req)
    result = json.loads(resp)
    print(f'    成功! RecordId: {result.get("RecordId")}')

    # 4. 验证
    print('>>> 验证解析...')
    req2 = DescribeDomainRecordsRequest()
    req2.set_DomainName(DOMAIN)
    req2.set_RRKeyWord('@')
    req2.set_TypeKeyWord('AAAA')
    resp2 = client.do_action_with_exception(req2)
    data2 = json.loads(resp2)
    records2 = data2.get('DomainRecords', {}).get('Record', [])
    for r in records2:
        if r['RR'] == '@':
            print(f'    ✅ {DOMAIN} AAAA -> {r["Value"]} (TTL: {r["TTL"]})')

    return True

def create_ddns_script():
    """生成 DDNS 自动更新脚本"""
    script = f'''#!/usr/bin/env python3
"""DDNS - 阿里云 IPv6 动态 DNS 更新脚本
每5分钟检测公网IPv6，变化时自动更新阿里云DNS解析
"""
import json, subprocess, sys, os, logging
from datetime import datetime

# 配置
ACCESS_KEY_ID = '{ACCESS_KEY_ID}'
ACCESS_KEY_SECRET = '{ACCESS_KEY_SECRET}'
DOMAIN = '{DOMAIN}'
SUB_DOMAIN = '@'
RECORD_TYPE = 'AAAA'
TTL = 600
LOG_FILE = '/vol2/1000/ZY/ddns/ddns.log'
STATE_FILE = '/vol2/1000/ZY/ddns/current_ipv6'

# 日志
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
log = logging.getLogger('ddns')

def get_public_ipv6():
    """获取公网 IPv6 地址"""
    try:
        result = subprocess.run(
            ['curl', '-6', '-s', '--max-time', '10', 'https://ipv6.icanhazip.com'],
            capture_output=True, text=True, timeout=15
        )
        ip = result.stdout.strip()
        if ip and ':' in ip:
            return ip
    except Exception as e:
        log.error(f'获取IPv6失败(icanhazip): {{e}}')
    
    # 备用方法：从网卡获取
    try:
        result = subprocess.run(
            ['ip', '-6', 'addr', 'show', 'scope', 'global'],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.split('\\n'):
            if 'inet6' in line and '2409:' in line:
                # 提取地址，去掉/后的前缀长度
                addr = line.strip().split()[1].split('/')[0]
                return addr
    except Exception as e:
        log.error(f'获取IPv6失败(ip addr): {{e}}')
    
    return None

def get_cached_ipv6():
    """读取缓存的IPv6"""
    try:
        with open(STATE_FILE, 'r') as f:
            return f.read().strip()
    except:
        return None

def save_ipv6(ip):
    """保存当前IPv6"""
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        f.write(ip)

def update_dns(ip):
    """更新阿里云DNS记录"""
    sys.path.insert(0, '/vol2/1000/ZY/ddns/lib')
    from aliyunsdkcore.client import AcsClient
    from aliyunsdkalidns.request.v20150109.DescribeDomainRecordsRequest import DescribeDomainRecordsRequest
    from aliyunsdkalidns.request.v20150109.UpdateDomainRecordRequest import UpdateDomainRecordRequest
    from aliyunsdkalidns.request.v20150109.AddDomainRecordRequest import AddDomainRecordRequest

    client = AcsClient(ACCESS_KEY_ID, ACCESS_KEY_SECRET, 'cn-hangzhou')

    # 查询现有记录
    req = DescribeDomainRecordsRequest()
    req.set_DomainName(DOMAIN)
    req.set_RRKeyWord(SUB_DOMAIN)
    req.set_TypeKeyWord(RECORD_TYPE)
    resp = client.do_action_with_exception(req)
    data = json.loads(resp)
    records = data.get('DomainRecords', {{}}).get('Record', [])

    target_rr = SUB_DOMAIN if SUB_DOMAIN != '@' else '@'
    
    for r in records:
        if r['RR'] == target_rr and r['Type'] == RECORD_TYPE:
            if r['Value'] == ip:
                log.info(f'IPv6未变化: {{ip}}，无需更新')
                return True
            # 更新现有记录
            log.info(f'更新DNS: {{r["Value"]}} -> {{ip}}')
            update_req = UpdateDomainRecordRequest()
            update_req.set_RecordId(r['RecordId'])
            update_req.set_RR(target_rr)
            update_req.set_Type(RECORD_TYPE)
            update_req.set_Value(ip)
            update_req.set_TTL(TTL)
            client.do_action_with_exception(update_req)
            log.info(f'DNS更新成功!')
            return True

    # 没有记录，新建
    log.info(f'新建AAAA记录: {{DOMAIN}} -> {{ip}}')
    add_req = AddDomainRecordRequest()
    add_req.set_DomainName(DOMAIN)
    add_req.set_RR(target_rr)
    add_req.set_Type(RECORD_TYPE)
    add_req.set_Value(ip)
    add_req.set_TTL(TTL)
    client.do_action_with_exception(add_req)
    log.info(f'DNS新建成功!')
    return True

def main():
    log.info('DDNS 检查开始')
    current_ip = get_public_ipv6()
    if not current_ip:
        log.error('无法获取公网IPv6')
        return
    
    cached_ip = get_cached_ipv6()
    log.info(f'当前IPv6: {{current_ip}}, 缓存: {{cached_ip}}')
    
    if current_ip != cached_ip:
        log.info(f'IPv6变化! 更新DNS...')
        try:
            update_dns(current_ip)
            save_ipv6(current_ip)
            log.info('DDNS更新完成')
        except Exception as e:
            log.error(f'DDNS更新失败: {{e}}')
    else:
        log.info('IPv6未变化，无需更新')

if __name__ == '__main__':
    main()
'''
    return script

def deploy_ddns_to_nas():
    """部署 DDNS 脚本到 NAS"""
    import paramiko
    
    print('\n>>> 连接 NAS...')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(NAS_HOST, port=NAS_PORT, username=NAS_USER, password=NAS_PWD, timeout=15)
    print('    连接成功!')
    
    SUDO = f'echo {NAS_PWD} | sudo -S'
    
    # 1. 创建目录
    print('>>> 创建 DDNS 目录...')
    ssh.exec_command(f'mkdir -p /vol2/1000/ZY/ddns/lib', get_pty=True)
    import time; time.sleep(1)
    
    # 2. 上传 DDNS 脚本
    print('>>> 上传 DDNS 脚本...')
    ddns_script = create_ddns_script()
    sftp = ssh.open_sftp()
    
    with sftp.open('/vol2/1000/ZY/ddns/ddns.py', 'w') as f:
        f.write(ddns_script)
    print('    ddns.py 已上传')
    
    # 3. 安装阿里云 SDK 到 NAS
    print('>>> 安装阿里云 SDK 到 NAS...')
    stdin, stdout, stderr = ssh.exec_command(
        f'pip3 install --target /vol2/1000/ZY/ddns/lib aliyun-python-sdk-core aliyun-python-sdk-alidns 2>&1',
        get_pty=True
    )
    result = stdout.read().decode('utf-8', errors='replace')
    if 'Successfully' in result:
        print('    SDK 安装成功!')
    else:
        print(f'    SDK 安装结果: {result[-200:]}')
    
    # 4. 测试运行 DDNS
    print('>>> 测试运行 DDNS...')
    stdin, stdout, stderr = ssh.exec_command(
        f'cd /vol2/1000/ZY/ddns && PYTHONPATH=/vol2/1000/ZY/ddns/lib python3 ddns.py 2>&1',
        get_pty=True
    )
    result = stdout.read().decode('utf-8', errors='replace')
    print(f'    {result.strip()[-200:]}')
    
    # 5. 设置 cron 定时任务 (每5分钟)
    print('>>> 配置 crontab...')
    # 先检查是否已有 DDNS 定时任务
    stdin, stdout, stderr = ssh.exec_command('crontab -l 2>/dev/null', get_pty=True)
    existing = stdout.read().decode('utf-8', errors='replace')
    
    ddns_cron = '*/5 * * * * cd /vol2/1000/ZY/ddns && PYTHONPATH=/vol2/1000/ZY/ddns/lib python3 ddns.py >> /vol2/1000/ZY/ddns/ddns.log 2>&1'
    
    if 'ddns.py' in existing:
        print('    crontab 已存在 DDNS 任务')
    else:
        new_cron = existing.strip() + '\n' + ddns_cron + '\n' if existing.strip() else ddns_cron + '\n'
        stdin, stdout, stderr = ssh.exec_command(f'echo "{new_cron}" | crontab -', get_pty=True)
        stdout.read()
        print('    crontab 已添加 (每5分钟检测)')
    
    # 6. 验证 crontab
    stdin, stdout, stderr = ssh.exec_command('crontab -l 2>/dev/null | grep ddns', get_pty=True)
    print(f'    验证: {stdout.read().decode("utf-8", errors="replace").strip()}')
    
    # 7. 检查 DDNS 日志
    stdin, stdout, stderr = ssh.exec_command('cat /vol2/1000/ZY/ddns/ddns.log 2>/dev/null | tail -5', get_pty=True)
    log = stdout.read().decode('utf-8', errors='replace').strip()
    if log:
        print(f'    日志: {log[-200:]}')
    
    ssh.close()
    return True

if __name__ == '__main__':
    print('='*55)
    print('  阿里云 IPv6 DNS 配置工具')
    print('='*55)
    
    # Step 1: 配置 DNS
    print('\n【步骤 1/2】配置 AAAA 记录')
    try:
        setup_dns_record()
        print('\n✅ DNS 记录配置完成!')
    except Exception as e:
        print(f'\n❌ DNS 配置失败: {e}')
        import traceback; traceback.print_exc()
    
    # Step 2: 部署 DDNS
    print('\n【步骤 2/2】部署 DDNS 到 NAS')
    try:
        deploy_ddns_to_nas()
        print('\n✅ DDNS 部署完成!')
    except Exception as e:
        print(f'\n❌ DDNS 部署失败: {e}')
        import traceback; traceback.print_exc()
    
    print('\n' + '='*55)
    print('  配置完成!')
    print(f'  域名: {DOMAIN}')
    print(f'  IPv6: {NAS_IPV6}')
    print(f'  访问: http://[{NAS_IPV6}]:3001')
    print(f'  DDNS: 每5分钟自动检测更新')
    print('='*55)
