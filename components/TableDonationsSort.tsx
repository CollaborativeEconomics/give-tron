'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { title } from 'process'
import { coinFromChain } from '@/libs/utils/chain'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ColumnDef, createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'

interface Donation {
  id: string
  created: Date
  initiative: { title: string }
  organization: { name: string }
  amount: string
  chain: string
  storyId: string
  image: string
  impactScore: string
  impactLabel: string
}

interface DonationHeader extends Omit<Donation, 'initiative' | 'organization'> {
  initiative: string
  organization: string
}

type Dictionary = { [key: string]: any }

export default function TableDonationsSort(props: Dictionary) {
  const router = useRouter()
  const donations: Donation[] = props?.donations || []
  const records = donations.map((rec) => {
    const unitValue = rec.impactlinks.length > 0 ? (rec.impactlinks[0].story?.unitvalue||0) : 0
    let impactScore = ''
    if(unitValue>0){
      impactScore = Math.ceil(rec.amount / unitValue).toString()
    }
    const unitLabel = rec.impactlinks.length > 0 ? (rec.impactlinks[0].story?.unitlabel||'') : ''
    let impactLabel = unitLabel
    if(unitLabel){
      impactLabel = unitLabel + (impactScore == '1' ? '' : 's')
    }
    //console.log('UNITS', unitValue, unitLabel)
    console.log('IMPACT', impactScore, impactLabel)
    return {
      id: rec.id,
      created: rec.created,
      initiative: rec.initiative.title,
      organization: rec.organization.name,
      amount: rec.amount,
      chain: rec.chain,
      storyId: rec.storyId,
      image: rec.storyId ? '/media/icon-story.svg' : '',
      impactScore,
      impactLabel,
    }
  })

  const [data, setData] = useState(records)
  const [sorting, setSorting] = useState<SortingState>([])

  const columnHelper = createColumnHelper<DonationHeader>()

  const columns = [
    columnHelper.accessor('created', {
      header: 'Date',
      cell: (info) => new Date(info.getValue().toString()).toLocaleString(),
    }),
    columnHelper.accessor('initiative', {
      header: 'Initiative',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('organization', {
      header: 'Organization',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('amount', {
      header: 'USD Amount',
      cell: (info) => '$'+parseFloat(info.getValue()).toFixed(2).toString(),
    }),
    columnHelper.accessor('chain', {
      header: 'Chain',
      cell: (info) => info.getValue()
      //cell: (info) => coinFromChain(info.getValue()).toUpperCase(),
    }),
    columnHelper.accessor('impactScore', {
      header: '',
      cell: (info) => info.getValue()
    }),
    columnHelper.accessor('impactLabel', {
      header: 'Impact',
      cell: (info) => info.getValue()
    }),
    columnHelper.accessor('image', {
      header: '',
      cell: (info) => info.getValue()
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const list = table.getRowModel().rows

  function clicked(evt:any){
    if(list.length<1){ return }
    let rowid = 0
    // If image, get parent id
    if(evt.target.parentNode.tagName=='TD'){
      rowid = parseInt(evt.target.parentNode.parentNode.dataset.id)
    } else {
      rowid = parseInt(evt.target.parentNode.dataset.id)
    }
    const nftid = data[rowid].id
    console.log('CLICKED', rowid, nftid)
    console.log('DATA', data[rowid])
    router.push('/donations/'+nftid)
  }

  function NoRows(){
    return (
      <TableRow>
        <TableCell className="col-span-5">No donations found</TableCell>
      </TableRow>
    )
  }

  function AllRows(){
    return list.map((row) => {
      return (
        <TableRow key={row.id} data-id={row.id}>
          {row.getVisibleCells().map((cell) => {
            return (
              <TableCell key={cell.id}>
                { (cell?.column?.id=='image' && cell?.getValue()!='')
                  ? (<Image src={cell?.getValue() as string} width={20} height={20} alt="NFT" />)
                  : flexRender(cell.column.columnDef.cell, cell.getContext())
                }
              </TableCell>
            )}
          )}
        </TableRow>
      )
    })
  }

  return (
    <Table id="table-donations" className="w-full">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    {...{
                      className: header.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                      onClick: header.column.getToggleSortingHandler()
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc:  ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody onClick={clicked}>
        { list.length ? <AllRows /> : <NoRows /> }
      </TableBody>
    </Table>
  )
}
